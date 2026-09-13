# 腾讯OCR · rubick 插件 (rubick-tencent-ocr)

一个 [rubick](https://github.com/rubickCenter/rubick) 腾讯云 OCR 插件：图片 / 截图识别文本并一键复制，可合并为一行、保存历史。

使用腾讯云 [通用文字识别（高精度版）](https://cloud.tencent.com/document/product/866/34937)（GeneralAccurateOCR，印刷体推荐）与 [通用手写体识别](https://cloud.tencent.com/document/product/866/36212)（GeneralHandwritingOCR），签名采用腾讯云 TC3-HMAC-SHA256。

## 功能

- 粘贴（Ctrl+V）、拖拽、点击选图自动识别，弹窗即时显示文本
- rubick 中输入 `腾讯ocr` / `腾讯识别`，或在选中图片 / 图片文件时执行「腾讯ocr」直接识别
- 支持截图识别（rubick 环境支持时显示「截图」按钮）
- 一键复制全部结果，或「合并行」拼成一行
- 高精度文字识别（印刷体） / 通用手写体识别，右上角设置切换
- 可选保存最近 10 条识别历史，点击可恢复；设置里可「测试连接」

## 快速开始

```powershell
# 一键安装到本机 rubick（保留已装插件，只安装本仓库插件）
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

安装后完全退出并重新打开 rubick，输入 `腾讯ocr` 即可使用。

详细配置（SecretId / SecretKey / Region）见 [rubick-tencent-ocr/README.md](rubick-tencent-ocr/README.md)。

## 目录

```
├── install.ps1           # 一键安装脚本
└── rubick-tencent-ocr/   # 插件本体（config.js / package.json / plugin.json / index.html / preload.js / logo.png）
```

> 提示：`rubick-tencent-ocr/config.js` 用于本地填写密钥，已加入 `.gitignore`，不会随本仓库上传。

## 更新日志

### v0.1.1 (2026-08-25)
- **fix**: Logo 绝对路径修复 + 安装冲突修复（npm/package.json 同步）
- **chore**: 拆分为独立项目，独立 git 仓库

### v0.1.0
- 初始版本
