import pytest
import asyncio
from pyppeteer import launch
import os
from typing import Any
import logging
from dataclasses import dataclass

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class TestContext:
    """测试上下文类，用于存储测试相关的状态和工具函数"""
    browser: Any
    page: Any
    extension_path: str

class ChromeExtensionTest:
    """Chrome扩展测试基类"""
    
    @staticmethod
    async def create_test_context(headless: bool = False) -> TestContext:
        """创建测试上下文"""
        # 获取项目根目录
        extension_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        browser = await launch(
            headless=headless,
            executablePath="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            args=[
                '--no-sandbox',
                f'--disable-extensions-except={extension_path}',
                f'--load-extension={extension_path}'
            ]
        )
        page = await browser.newPage()
        await asyncio.sleep(2)  # 等待插件加载
        
        return TestContext(browser=browser, page=page, extension_path=extension_path)

    @staticmethod
    async def cleanup_context(context: TestContext):
        """清理测试上下文"""
        await context.browser.close()

    @staticmethod
    async def load_test_page(page: Any):
        """加载测试页面"""
        test_path = os.path.join(os.path.dirname(__file__), 'test.html')
        await page.goto(f'file://{os.path.abspath(test_path)}')
        await asyncio.sleep(1)  # 等待页面加载完成


class TestDownloadSubtitles(ChromeExtensionTest):
    """测试下载字幕功能"""
    async def test_download_subtitles(self, context: TestContext):
        """测试下载字幕,地址为https://www.youtube.com/watch?v=oc6RV5c1yd0"""
        pass
    
@pytest.mark.asyncio
async def test_extension():
    """主测试函数"""
    logger.info("\n=== 开始 Chrome 扩展测试 ===\n")
    
    context = await ChromeExtensionTest.create_test_context(headless=False)
    
    try:
        # 加载测试页面
        await ChromeExtensionTest.load_test_page(context.page)
        
        # 运行add函数测试
        logger.info("测试 Add 函数功能:")
        add_test = TestDownloadSubtitles()
        await add_test.test_add_positive_numbers(context)
        await add_test.test_add_negative_numbers(context)
        await add_test.test_add_mixed_numbers(context)
        
        logger.info("\n=== 所有测试通过 ===")
        
    finally:
        await ChromeExtensionTest.cleanup_context(context) 