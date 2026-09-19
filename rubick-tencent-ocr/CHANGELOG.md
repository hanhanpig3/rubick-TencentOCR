# Changelog

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.2.0] - 2026-09-19

### 新增
- 新增 14 种 OCR 类型：表格、高精度表格、增值税发票、增值税发票新版、火车票、航空行程单、身份证、护照、驾驶证、银行卡、营业执照、车牌
- 表格识别结果可复制为 Excel/Markdown/CSV/JSON，粘 Excel 自动保留格式
- 富文本剪贴板（HTML + 纯文本双写），Excel/WPS 粘 HTML 自动识别为表格
- 结构化字段提取（发票/身份证等），字段可视化展示
- 类型下拉框直接在主窗口切换，无需打开设置
- 新增 Rubick 关键词触发：`表格识别`/`发票识别`/`身份证识别`/`银行卡识别`/`车牌识别`
- 主窗口可接收 `data.code` 和 `data.ext.code` 自动切换识别类型
- package.json 增加 NPM 发布元数据（publishConfig/files/keywords/license/repository）
- 新增 `rubick` 元字段（类似 tinker 的 `tinker` 字段）
- 新增 CHANGELOG.md、LICENSE、.npmignore

### 修复
- 修复 `recognizeBase64` 和 `recognizeFromFilePath` 中 `cfg` 变量未定义的作用域 bug

### 技术变更
- `preload.js` 新增 `TYPES` 配置表，统一管理 16 种 OCR 类型
- `preload.js` 新增 `tableToHtml`/`tableToCsv`/`tableToMarkdown`/`tableToJson`/`fieldsOf`/`fieldsToText`/`fieldsToJson`/`copyRich`/`copyText` 等方法
- `index.html` 重写：类型下拉、表格 HTML 预览、结构化字段展示、多格式复制按钮

## [0.1.1] - 2026-08-25

### 修复
- install.ps1 自动将 logo 相对路径解析为绝对 `file://` 路径，修复 rubick 搜索栏/选项列表中 logo 不显示的问题
- install.ps1 自动同步 `rubick-plugins-new/package.json` 的 dependencies，修复从官方市场安装其他插件后本插件被 npm 清除的问题

### 变更
- 两个插件拆分为独立项目目录，各自拥有独立 git 仓库

## [0.1.0] - 2026-08-25

### 新增
- 初始版本：腾讯云 OCR 图片识别
- TC3-HMAC-SHA256 签名
- 高精度文字识别（GeneralAccurateOCR）/ 通用手写体识别（GeneralHandwritingOCR）
- 设置面板（SecretId/SecretKey/Region/类型）
- 识别历史（最近 10 条）
- 连接测试
