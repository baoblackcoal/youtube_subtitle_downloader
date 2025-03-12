# YouTube 字幕下载器 Chrome 扩展

这是一个简单实用的 Chrome 扩展程序，可以帮助您轻松下载 YouTube 视频的字幕文件。

## 功能特点

- 支持下载 YouTube 视频的字幕
- 支持自动生成的英文字幕和手动添加的英文字幕
- 提供多种字幕格式选择：
  - VTT 格式
  - SRT 格式
  - TXT 纯文本格式
- 支持一键粘贴视频链接
- 支持自动下载字幕文件
- 简洁直观的用户界面

## 安装说明

1. 下载或克隆此仓库到本地
2. 打开 Chrome 浏览器，进入扩展程序页面：
   - 在地址栏输入 `chrome://extensions/`
   - 或者点击菜单 -> 更多工具 -> 扩展程序
3. 在扩展程序页面右上角启用"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择本仓库所在的文件夹
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
6. 点击"获取字幕"按钮
7. 字幕文件将自动下载到您的计算机

## 权限说明

本扩展需要以下权限：
- `activeTab`: 访问当前标签页信息
- `scripting`: 执行内容脚本
- `clipboardRead`: 读取剪贴板内容（用于粘贴视频链接）
- `downloads`: 下载字幕文件
- `tabs`: 处理标签页

## 注意事项

- 仅支持 YouTube 网站的视频
- 视频必须包含字幕才能下载
- 目前仅支持英文字幕

## 技术支持

如果您在使用过程中遇到任何问题，请提交 Issue。

## 许可证

MIT License 