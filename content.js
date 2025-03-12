// 监听来自 popup 或 background 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageInfo') {
        // 获取当前页面信息
        const videoId = getVideoId();
        const pageData = {
            videoId: videoId,
            url: window.location.href,
            title: document.title
        };
        sendResponse(pageData);
    }
});

// 从 URL 中提取视频 ID
function getVideoId() {
    const url = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
} 