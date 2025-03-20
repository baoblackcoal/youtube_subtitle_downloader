import pytest
import asyncio
from pyppeteer import launch
import os
import logging
import time
import glob
import shutil
from pathlib import Path
from dataclasses import dataclass
from typing import Optional, List, Any

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class TestContext:
    """测试上下文类，用于存储测试相关的状态和工具函数"""
    browser: Any
    page: Any
    extension_path: str
    extension_id: Optional[str] = None
    downloads_folder: Optional[str] = None
    
    def set_extension_id(self, extension_id: str):
        """设置扩展ID"""
        self.extension_id = extension_id
    
    def set_downloads_folder(self, downloads_folder: str):
        """设置下载文件夹"""
        self.downloads_folder = downloads_folder

class ChromeExtensionTest:
    """Chrome扩展测试基类"""
    
    @staticmethod
    async def create_test_context(headless: bool = False,
                                 downloads_folder: Optional[str] = None) -> TestContext:
        """创建测试上下文"""
        # 获取项目根目录
        extension_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src'))
        
        # 设置下载文件夹
        if downloads_folder is None:
            downloads_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), 'downloads'))
        
        # 确保下载文件夹存在
        os.makedirs(downloads_folder, exist_ok=True)
        
        # 启动浏览器
        browser = await launch(
            headless=headless,
            executablePath="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            args=[
                '--no-sandbox',
                f'--disable-extensions-except={extension_path}',
                f'--load-extension={extension_path}',
                '--disable-web-security',  # 允许跨源请求
                f'--user-data-dir={os.path.join(downloads_folder, "user_data")}',
                f'--download.default_directory={downloads_folder}',
                '--proxy-server=192.168.1.16:10811'  # 添加代理服务器配置
            ],
            defaultViewport={
                'width': 1280,
                'height': 800
            }
        )
        
        # 创建新页面
        page = await browser.newPage()
        
        # 设置下载行为
        await page._client.send('Page.setDownloadBehavior', {
            'behavior': 'allow',
            'downloadPath': downloads_folder
        })
        
        await asyncio.sleep(2)  # 等待插件加载
        
        # 创建测试上下文
        context = TestContext(
            browser=browser,
            page=page,
            extension_path=extension_path,
            downloads_folder=downloads_folder
        )
        
        return context

    @staticmethod
    async def cleanup_context(context: TestContext):
        """清理测试上下文"""
        await context.browser.close()
        
        # 清理下载文件夹中的临时文件
        if context.downloads_folder and os.path.exists(context.downloads_folder):
            try:
                for path in glob.glob(os.path.join(context.downloads_folder, '*_subtitles.*')):
                    os.remove(path)
                
                user_data_dir = os.path.join(context.downloads_folder, "user_data")
                if os.path.exists(user_data_dir):
                    shutil.rmtree(user_data_dir)
            except Exception as e:
                logger.warning(f"清理临时文件失败: {e}")

    @staticmethod
    async def load_test_page(context: TestContext):
        """加载测试页面"""
        test_path = os.path.join(os.path.dirname(__file__), 'test.html')
        await context.page.goto(f'file://{os.path.abspath(test_path)}')
        await asyncio.sleep(1)  # 等待页面加载完成
        
        # 等待测试控制器初始化
        await context.page.waitForFunction('typeof window.YTSubtitleDownloader !== "undefined"')
        await asyncio.sleep(1)
        
        logger.info("成功加载测试页面")

    @staticmethod
    async def get_extension_id(context: TestContext) -> str:
        """获取扩展ID"""
        if context.extension_id:
            return context.extension_id
            
        # 获取所有标签页
        targets = await context.browser.targets()
        background_target = next(
            (t for t in targets if t.type == 'background_page' and t.url.startswith('chrome-extension://')),
            None
        )
        
        if not background_target:
            raise Exception("无法获取扩展背景页面")
        
        # 从URL中提取扩展ID
        extension_id = background_target.url.split('/')[2]
        context.set_extension_id(extension_id)
        
        logger.info(f"获取到扩展ID: {extension_id}")
        return extension_id

    @staticmethod
    async def open_extension_options_page(context: TestContext):
        """打开扩展选项页面"""
        extension_id = await ChromeExtensionTest.get_extension_id(context)
        
        # 打开扩展选项页面
        options_url = f'chrome-extension://{extension_id}/views/options.html'
        await context.page.goto(options_url)
        await asyncio.sleep(2)  # 等待选项页面加载
        
        logger.info(f"成功打开扩展选项页面")
        return extension_id


@pytest.mark.asyncio
async def test_extension():
    """主测试函数"""
    logger.info("\n=== 开始 Chrome 扩展测试 ===\n")
    
    # 创建下载文件夹
    downloads_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), 'downloads'))
    os.makedirs(downloads_folder, exist_ok=True)
    
    context = await ChromeExtensionTest.create_test_context(
        headless=False,
        downloads_folder=downloads_folder
    )
    
    try:
         await asyncio.sleep(20)
        
    finally:
        await ChromeExtensionTest.cleanup_context(context) 

if __name__ == "__main__":
    asyncio.run(test_extension())