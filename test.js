// 测试用例
const testUrls = [
    'https://youtu.be/GiEsyOyk1m4?si=xPECLiIHKMwF_lsv',
    'https://www.youtube.com/watch?si=xPECLiIHKMwF_lsv&v=GiEsyOyk1m4&feature=youtu.be',
    'https://www.youtube.com/watch?v=GiEsyOyk1m4&t=17s',
    'https://www.youtube.com/watch?v=GiEsyOyk1m4&list=PLOXw6I10VTv8VOvPNVQ8c4D4NyMRMotXh&index=20',
    'https://www.youtube.com/live/hciNKcLwSes?si=0TqGb4yFEIcxTJzr'
];

// URL验证函数
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

// 视频ID提取函数
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

// 运行测试
console.log('Testing URL validation and video ID extraction:');
testUrls.forEach((url, index) => {
    console.log(`\nURL ${index + 1}: ${url}`);
    console.log('Is valid:', isValidYouTubeUrl(url));
    console.log('Video ID:', extractVideoId(url));
}); 