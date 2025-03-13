# Chrome Extension 测试文档

本文档描述了 Chrome 扩展的自动化测试框架和使用方法。

## 测试结构

```
test/
├── README.md           # 测试文档
├── test_extension.py   # 测试主文件
├── test.html          # 测试页面
└── pytest.ini         # pytest 配置文件
```

## 测试内容

测试框架包含以下测试：

1. **Add 函数测试** (`AddFunctionTest`)
   - 测试正数相加 (2 + 3 = 5)
   - 测试负数相加 (-2 + -3 = -5)
   - 测试正负数混合相加 (-2 + 3 = 1)

## 运行测试

1. **安装依赖**
   ```bash
   # 创建并激活虚拟环境
   python -m venv venv
   .\venv\Scripts\activate  # Windows
   source venv/bin/activate  # Linux/Mac

   # 安装依赖
   pip install -r requirements.txt
   ```

2. **运行测试**
   ```bash
   # 在项目根目录运行
   python -m pytest test/test_extension.py
   ```

## 测试输出说明

测试输出采用清晰的格式，包含以下信息：
- ✓ 表示测试通过
- 详细的测试步骤和结果
- 计算结果验证

示例输出：
```
=== 开始 Chrome 扩展测试 ===
测试 Add 函数功能:
✓ 正数相加测试通过: 2 + 3 = 5
✓ 负数相加测试通过: -2 + -3 = -5
✓ 混合数字相加测试通过: -2 + 3 = 1

=== 所有测试通过 ===
```

## 添加新测试

要添加新的测试，请按照以下步骤：

1. 在 `test.html` 中添加新的测试工具函数：
   ```javascript
   const TestUtils = {
       // 添加新的测试函数
       newTestFunction() {
           // 实现测试逻辑
       }
   };
   ```

2. 创建新的测试类：
   ```python
   class NewFeatureTest(ChromeExtensionTest):
       async def test_new_feature(self, context: TestContext):
           # 实现测试逻辑
           pass
   ```

3. 在主测试函数中添加新测试：
   ```python
   @pytest.mark.asyncio
   async def test_extension():
       # ... 现有代码 ...
       new_test = NewFeatureTest()
       await new_test.test_new_feature(context)
   ```

## 注意事项

1. **环境要求**
   - Python 3.8+
   - Google Chrome 浏览器
   - Windows 10 操作系统（其他系统需修改 Chrome 路径）

2. **Chrome 路径**
   - 默认路径：`C:\Program Files\Google\Chrome\Application\chrome.exe`
   - 如需修改，更新 `test_extension.py` 中的 `executablePath`

3. **测试页面**
   - `test.html` 包含所有测试工具函数
   - 修改测试页面时需确保 `TestUtils` 对象完整性

4. **异步测试**
   - 所有测试都是异步的
   - 使用 `async/await` 语法
   - 确保正确处理异步操作

## 故障排除

1. **Chrome 未找到**
   - 检查 Chrome 安装路径
   - 更新 `executablePath` 配置

2. **测试超时**
   - 增加 `asyncio.sleep()` 等待时间
   - 检查网络连接
   - 确保系统资源充足

3. **测试失败**
   - 检查 Chrome 扩展是否正确加载
   - 验证测试页面是否正确加载
   - 查看详细错误信息 