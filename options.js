document.addEventListener('DOMContentLoaded', function() {
    const videoUrlInput = document.getElementById('videoUrl');
    const getSubtitlesButton = document.getElementById('getSubtitles');
    const pasteAndGetButton = document.getElementById('pasteAndGet');
    const statusDiv = document.getElementById('status');
    const autoDownloadCheckbox = document.getElementById('autoDownload');

    // 设置默认视频链接
    videoUrlInput.value = 'https://www.youtube.com/watch?v=oc6RV5c1yd0';

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
    function isValidYouTubeUrl(url) {
        const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})$/;
        return pattern.test(url);
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
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
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
            
            switch (targetFormat) {
                case 'vtt':
                    convertedSubtitles = 'WEBVTT\n\n';
                    for (let i = 0; i < textNodes.length; i++) {
                        const node = textNodes[i];
                        const start = formatTime(parseFloat(node.getAttribute('start')));
                        const duration = parseFloat(node.getAttribute('dur') || '0');
                        const end = formatTime(parseFloat(node.getAttribute('start')) + duration);
                        
                        convertedSubtitles += `${i + 1}\n`;
                        convertedSubtitles += `${start} --> ${end}\n`;
                        convertedSubtitles += `${node.textContent}\n\n`;
                    }
                    break;
                    
                case 'srt':
                    for (let i = 0; i < textNodes.length; i++) {
                        const node = textNodes[i];
                        const start = formatTimeSRT(parseFloat(node.getAttribute('start')));
                        const duration = parseFloat(node.getAttribute('dur') || '0');
                        const end = formatTimeSRT(parseFloat(node.getAttribute('start')) + duration);
                        
                        convertedSubtitles += `${i + 1}\n`;
                        convertedSubtitles += `${start} --> ${end}\n`;
                        convertedSubtitles += `${node.textContent}\n\n`;
                    }
                    break;
                    
                case 'txt':
                    for (let i = 0; i < textNodes.length; i++) {
                        convertedSubtitles += `${textNodes[i].textContent}\n`;
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
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            // 获取视频标题
            let filename;
            try {
                const videoTitle = await getVideoTitle(videoId);
                // 移除不合法的文件名字符
                const safeTitle = videoTitle.replace(/[<>:"/\\|?*]/g, '_');
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