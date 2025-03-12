document.addEventListener('DOMContentLoaded', async function() {
    const videoUrlInput = document.getElementById('videoUrl');
    const getSubtitlesButton = document.getElementById('getSubtitles');
    const pasteAndGetButton = document.getElementById('pasteAndGet');
    const statusDiv = document.getElementById('status');
    const autoDownloadCheckbox = document.getElementById('autoDownload');

    // 尝试从storage获取当前视频URL
    try {
        const result = await chrome.storage.local.get('currentVideoUrl');
        if (result.currentVideoUrl) {
            videoUrlInput.value = result.currentVideoUrl;
            // 清除存储的URL，避免影响下次打开
            await chrome.storage.local.remove('currentVideoUrl');
        }
    } catch (error) {
        console.error('获取存储的视频URL失败:', error);
    }

    // 获取来源标签页的信息
    chrome.tabs.query({active: true, lastFocusedWindow: true}, async function(tabs) {
        const sourceTab = tabs[0];
        if (sourceTab && sourceTab.url.includes('youtube.com/watch')) {
            videoUrlInput.value = sourceTab.url;
        }
    });

    // 获取字幕按钮点击事件
    getSubtitlesButton.addEventListener('click', () => {
        const url = videoUrlInput.value.trim();
        if (!isValidYouTubeUrl(url)) {
            showStatus('请输入有效的 YouTube 视频链接', 'error');
            return;
        }
        downloadSubtitles(url);
    });

    // 粘贴并获取按钮点击事件
    pasteAndGetButton.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            videoUrlInput.value = text;
            if (!isValidYouTubeUrl(text)) {
                showStatus('剪贴板中的链接不是有效的 YouTube 视频链接', 'error');
                return;
            }
            downloadSubtitles(text);
        } catch (err) {
            showStatus('无法访问剪贴板', 'error');
        }
    });

    // 验证 YouTube URL
    /*
    支持以下链接格式：
    https://www.youtube.com/watch?v=GiEsyOyk1m4
    https://youtu.be/GiEsyOyk1m4?si=xPECLiIHKMwF_lsv
    https://www.youtube.com/watch?si=xPECLiIHKMwF_lsv&v=GiEsyOyk1m4&feature=youtu.be
    https://www.youtube.com/watch?v=GiEsyOyk1m4&t=17s
    https://www.youtube.com/watch?v=GiEsyOyk1m4&list=PLOXw6I10VTv8VOvPNVQ8c4D4NyMRMotXh&index=20
    https://www.youtube.com/live/hciNKcLwSes?si=0TqGb4yFEIcxTJzr
    */
    function isValidYouTubeUrl(url) {
        try {
            const urlObj = new URL(url);
            if (!urlObj.hostname.match(/^(www\.)?(youtube\.com|youtu\.be)$/)) {
                return false;
            }
            
            let videoId = null;
            
            // 处理 youtu.be 短链接
            if (urlObj.hostname.includes('youtu.be')) {
                videoId = urlObj.pathname.split('/')[1];
            }
            // 处理 youtube.com 标准链接和直播链接
            else if (urlObj.hostname.includes('youtube.com')) {
                const params = new URLSearchParams(urlObj.search);
                if (urlObj.pathname.includes('/live/')) {
                    // 处理直播链接格式
                    videoId = urlObj.pathname.split('/live/')[1]?.split('?')[0];
                } else {
                    // 处理标准链接格式
                    videoId = params.get('v');
                }
            }
            
            // 验证视频ID是否存在且格式正确（11位字母数字、下划线或连字符）
            return videoId !== null && /^[a-zA-Z0-9_-]{11}$/.test(videoId);
        } catch (e) {
            return false;
        }
    }

    // 显示状态信息
    function showStatus(message, type = 'info') {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        
        if (type !== 'loading') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }
    }

    // 下载字幕
    async function downloadSubtitles(url) {
        showStatus('正在获取字幕...', 'loading');

        const videoId = extractVideoId(url);
        if (!videoId) {
            showStatus('无法获取视频 ID', 'error');
            return;
        }

        const subtitleType = document.querySelector('input[name="subtitleType"]:checked').value;
        const format = document.querySelector('input[name="format"]:checked').value;
        const autoDownload = autoDownloadCheckbox.checked;

        try {
            // 发送消息给 background script 获取字幕
            chrome.runtime.sendMessage({
                action: 'getSubtitles',
                videoId: videoId,
                subtitleType: subtitleType
            }, async response => {
                if (chrome.runtime.lastError) {
                    showStatus('获取字幕时发生错误: ' + chrome.runtime.lastError.message, 'error');
                    return;
                }

                if (response.success) {
                    try {
                        const convertedSubtitles = convertSubtitleFormat(response.subtitles, format);
                        if (autoDownload) {
                            await downloadSubtitleFile(convertedSubtitles, videoId, format);
                        }
                        showStatus('字幕下载成功！', 'success');
                    } catch (error) {
                        showStatus('转换字幕格式失败: ' + error.message, 'error');
                    }
                } else {
                    showStatus(response.error || '获取字幕失败', 'error');
                }
            });
        } catch (error) {
            showStatus('获取字幕时发生错误: ' + error.message, 'error');
        }
    }

    // 从 URL 中提取视频 ID
    function extractVideoId(url) {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtu.be')) {
                return urlObj.pathname.split('/')[1];
            } else if (urlObj.hostname.includes('youtube.com')) {
                if (urlObj.pathname.includes('/live/')) {
                    return urlObj.pathname.split('/live/')[1]?.split('?')[0];
                } else {
                    const params = new URLSearchParams(urlObj.search);
                    return params.get('v');
                }
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    // 转换字幕格式
    function convertSubtitleFormat(subtitleData, targetFormat) {
        try {
            // 解析原始 XML 格式的字幕
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(subtitleData, 'text/xml');
            const textNodes = xmlDoc.getElementsByTagName('text');
            
            if (textNodes.length === 0) {
                throw new Error('字幕内容为空');
            }
            
            let convertedSubtitles = '';
            
            // 创建一个临时元素来解码 HTML 实体
            const decodeHTML = (html) => {
                const textarea = document.createElement('textarea');
                textarea.innerHTML = html;
                return textarea.value;
            };
            
            switch (targetFormat) {
                case 'vtt':
                    convertedSubtitles = 'WEBVTT\n\n';
                    for (let i = 0; i < textNodes.length; i++) {
                        const node = textNodes[i];
                        const start = formatTime(parseFloat(node.getAttribute('start')));
                        const duration = parseFloat(node.getAttribute('dur') || '0');
                        const end = formatTime(parseFloat(node.getAttribute('start')) + duration);
                        const text = decodeHTML(node.textContent);
                        
                        convertedSubtitles += `${i + 1}\n`;
                        convertedSubtitles += `${start} --> ${end}\n`;
                        convertedSubtitles += `${text}\n\n`;
                    }
                    break;
                    
                case 'srt':
                    for (let i = 0; i < textNodes.length; i++) {
                        const node = textNodes[i];
                        const start = formatTimeSRT(parseFloat(node.getAttribute('start')));
                        const duration = parseFloat(node.getAttribute('dur') || '0');
                        const end = formatTimeSRT(parseFloat(node.getAttribute('start')) + duration);
                        const text = decodeHTML(node.textContent);
                        
                        convertedSubtitles += `${i + 1}\n`;
                        convertedSubtitles += `${start} --> ${end}\n`;
                        convertedSubtitles += `${text}\n\n`;
                    }
                    break;
                    
                case 'txt':
                    for (let i = 0; i < textNodes.length; i++) {
                        const text = decodeHTML(textNodes[i].textContent);
                        convertedSubtitles += `${text}\n`;
                    }
                    break;
                    
                default:
                    throw new Error('不支持的字幕格式');
            }
            
            return convertedSubtitles;
        } catch (error) {
            console.error('转换字幕格式失败:', error);
            throw error;
        }
    }

    // 格式化时间为 VTT 格式
    function formatTime(seconds) {
        const date = new Date(seconds * 1000);
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const secs = date.getUTCSeconds().toString().padStart(2, '0');
        const ms = date.getUTCMilliseconds().toString().padStart(3, '0');
        return `${hours}:${minutes}:${secs}.${ms}`;
    }

    // 格式化时间为 SRT 格式
    function formatTimeSRT(seconds) {
        const date = new Date(seconds * 1000);
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const secs = date.getUTCSeconds().toString().padStart(2, '0');
        const ms = date.getUTCMilliseconds().toString().padStart(3, '0').slice(0, 3);
        return `${hours}:${minutes}:${secs},${ms}`;
    }

    // 获取视频标题
    async function getVideoTitle(videoId) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'getVideoInfo',
                videoId: videoId
            }, response => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                if (response.success && response.title) {
                    resolve(response.title);
                } else {
                    reject(new Error('无法获取视频标题'));
                }
            });
        });
    }

    // 下载字幕文件
    async function downloadSubtitleFile(content, videoId, format) {
        try {
            // 根据格式设置正确的MIME类型
            const mimeTypes = {
                'vtt': 'text/vtt',
                'srt': 'text/srt',
                'txt': 'text/plain'
            };
            const mimeType = mimeTypes[format] || 'text/plain';
            
            const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
            const url = URL.createObjectURL(blob);
            
            // 获取视频标题
            let filename;
            try {
                const videoTitle = await getVideoTitle(videoId);
                // 移除不合法的文件名字符
                const safeTitle = videoTitle.replace(/[<>:"/\\|?*]/g, '_');
                // 确保扩展名与format参数匹配
                filename = `${safeTitle}.${format}`;
            } catch (error) {
                console.warn('无法获取视频标题，使用默认文件名', error);
                filename = `subtitles_${videoId}.${format}`;
            }
            
            await chrome.downloads.download({
                url: url,
                filename: filename,
                saveAs: false
            });
            
            // 清理 URL 对象
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('下载字幕文件失败:', error);
            throw error;
        }
    }
}); 