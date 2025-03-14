# YouTube 字幕下载器 Chrome 扩展

这是一个简单实用的 Chrome 扩展程序，可以帮助您轻松下载 YouTube 视频的字幕文件。

## 功能特点
- 支持下载 YouTube 自动生成的英文字幕和手动添加的英文字幕
- 提供多种字幕格式选择（VTT,SRT和TXT）  
- 支持一键粘贴视频链接
- 点击工具栏中的扩展图标, 视频链接会自动填充到输入框中（如果当前标签页是 YouTube 视频）
- 支持手机Kiwi浏览器

## 项目结构

项目采用模块化设计，高内聚低耦合的架构：

```
src/
├── assets/              - 静态资源文件
│   ├── images/          - 图片资源
│   └── styles.css       - 样式表
├── controllers/         - 控制器
│   └── options-controller.js - 选项页面控制器
├── models/              - 数据模型（如需要）
├── services/            - 服务层
│   ├── subtitle-service.js - 字幕处理服务
│   ├── youtube-api-service.js - YouTube API交互服务
├── utils/               - 实用工具
│   ├── url-utils.js     - URL处理工具
│   └── ui-utils.js      - UI交互工具
├── views/               - 视图
│   └── options.html     - 选项页面
├── background.js        - 扩展后台脚本
├── content.js           - 内容脚本
├── manifest.json        - 扩展配置文件
└── options.js           - 选项页面主脚本
test/
├── downloads/           - 测试下载目录
└── test_download.py     - PyPpeteer集成测试
```

## 安装说明

1. 下载或克隆此仓库到本地
2. 打开 Chrome 浏览器，进入扩展程序页面：
   - 在地址栏输入 `chrome://extensions/`
   - 或者点击菜单 -> 更多工具 -> 扩展程序
3. 在扩展程序页面右上角启用"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择本仓库中的 `src` 文件夹
6. 安装完成后，您可以在 Chrome 工具栏看到扩展图标

## 使用方法

1. 访问任意 YouTube 视频页面
2. 点击 Chrome 工具栏中的扩展图标
3. 在打开的页面中：
   - 视频链接会自动填充（如果当前标签页是 YouTube 视频）
   - 或者手动粘贴 YouTube 视频链接
4. 选择字幕类型：
   - 英文（自动生成）
   - 英文（手动添加）
5. 选择输出格式：
   - VTT
   - SRT
   - TXT
6. 点击"下载"按钮
7. 字幕文件将自动下载到您的计算机

## 开发指南

### 开发环境设置

1. 克隆仓库:
   ```
   git clone https://github.com/yourusername/youtube-subtitle-downloader.git
   cd youtube-subtitle-downloader
   ```

2. 安装开发依赖:
   ```
   pip install -r requirements.txt
   ```

### 运行测试

项目包含两种测试方式：

#### JavaScript 单元测试

1. 在浏览器中打开 `test/test.html` 文件
2. 点击 "Run JavaScript Tests" 按钮
3. 测试结果将显示在控制台中

#### Python 集成测试

使用 PyPpeteer 进行端到端测试:

```
cd 项目根目录
python -m pytest test/test_download.py -v
```

### 扩展项目

1. **添加新功能**:
   - 在 `services/` 目录中添加新的服务
   - 在 `utils/` 目录中添加新的实用工具
   - 更新控制器以使用新服务

2. **修改界面**:
   - 编辑 `views/options.html` 文件
   - 更新 `assets/styles.css` 样式

3. **添加测试**:
   - 在 `test_script.js` 中添加新的测试用例
   - 更新 `test_download.py` 以测试新功能

## 权限说明

本扩展需要以下权限：
- `activeTab`: 访问当前标签页信息
- `scripting`: 执行内容脚本
- `clipboardRead`: 读取剪贴板内容（用于粘贴视频链接）
- `downloads`: 下载字幕文件
- `tabs`: 处理标签页
- `storage`: 临时存储数据

## 注意事项

- 仅支持 YouTube 网站的视频
- 视频必须包含字幕才能下载
- 目前仅支持英文字幕

## 技术支持

如果您在使用过程中遇到任何问题，请提交 Issue。

## 许可证

MIT License 