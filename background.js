// 在插件安装后自动打开 options 页面
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.runtime.openOptionsPage();
    }
});

// 监听扩展图标点击事件
chrome.action.onClicked.addListener(async (tab) => {
    // 检查是否是 YouTube 视频页面
    const include_youtube = tab.url.includes('youtube.com') || tab.url.includes('youtu.be');
    if (tab.url && include_youtube) {
        // 在打开选项页面之前，先存储当前视频的 URL
        await chrome.storage.local.set({ currentVideoUrl: tab.url });
    }
    chrome.runtime.openOptionsPage();
});

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSubtitles') {
        getSubtitles(request)
            .then(response => sendResponse(response))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // 保持消息通道打开
    } else if (request.action === 'getVideoInfo') {
        getVideoInfo(request.videoId)
            .then(response => sendResponse(response))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // 保持消息通道打开
    }
});

// 获取视频信息
async function getVideoInfo(videoId) {
    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const response = await fetch(videoUrl);
        if (!response.ok) {
            throw new Error('无法访问视频页面');
        }
        const html = await response.text();

        // 提取视频标题
        const titleMatch = html.match(/"title":"([^"]+)"/);
        if (!titleMatch) {
            throw new Error('无法获取视频标题');
        }

        const title = titleMatch[1].replace(/\\u0026/g, '&')
                                 .replace(/\\"/g, '"')
                                 .replace(/\\\\/g, '\\');

        return { success: true, title: title };
    } catch (error) {
        console.error('获取视频信息失败:', error);
        return { success: false, error: error.message };
    }
}

// 获取字幕的主要函数
async function getSubtitles({ videoId, subtitleType }) {
    try {
        // 获取视频页面
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const response = await fetch(videoUrl);
        if (!response.ok) {
            throw new Error('无法访问视频页面');
        }
        const html = await response.text();

        // 提取字幕数据
        const subtitleData = await extractSubtitleData(html, subtitleType);
        if (!subtitleData) {
            throw new Error('无法获取字幕数据');
        }

        return { success: true, subtitles: subtitleData };
    } catch (error) {
        console.error('获取字幕失败:', error);
        return { success: false, error: error.message };
    }
}

// 从页面提取字幕数据
async function extractSubtitleData(html, subtitleType) {
    try {
        // 尝试从不同的数据源提取字幕信息
        let ytInitialData = null;
        const dataMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
        if (dataMatch) {
            try {
                ytInitialData = JSON.parse(dataMatch[1]);
            } catch (e) {
                console.error('解析 ytInitialPlayerResponse 失败:', e);
            }
        }

        if (!ytInitialData || !ytInitialData.captions) {
            throw new Error('找不到字幕信息');
        }

        const captions = ytInitialData.captions.playerCaptionsTracklistRenderer;
        if (!captions || !captions.captionTracks || captions.captionTracks.length === 0) {
            throw new Error('该视频没有可用的字幕');
        }

        // 查找匹配的字幕轨道
        const subtitleTrack = captions.captionTracks.find(track => {
            const isAuto = track.kind === 'asr';
            const isEnglish = track.languageCode === 'en';
            return subtitleType === 'auto' ? (isAuto && isEnglish) : (!isAuto && isEnglish);
        });

        if (!subtitleTrack) {
            throw new Error('找不到所选类型的英文字幕');
        }

        // 处理字幕 URL，确保是完整的 URL
        let subtitleUrl = subtitleTrack.baseUrl;
        if (subtitleUrl.startsWith('api/') || subtitleUrl.startsWith('/api/')) {
            subtitleUrl = `https://www.youtube.com/${subtitleUrl.startsWith('/') ? subtitleUrl.slice(1) : subtitleUrl}`;
        }

        console.log('处理后的字幕 URL:', subtitleUrl);
        const subtitleResponse = await fetch(subtitleUrl);
        if (!subtitleResponse.ok) {
            throw new Error('获取字幕内容失败');
        }
        return await subtitleResponse.text();
    } catch (error) {
        console.error('提取字幕数据失败:', error);
        throw error;
    }
} 