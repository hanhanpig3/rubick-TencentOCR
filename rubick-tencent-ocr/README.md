# 腾讯OCR (rubick-tencent-ocr)

一个 [rubick](https://github.com/rubickCenter/rubick) 腾讯云 OCR 插件：图片 / 截图识别文本并一键复制，**表格识别结果可粘到 Excel 保留格式**，支持发票/身份证/银行卡/车牌等多种类型。

使用腾讯云 [通用文字识别（高精度版）](https://cloud.tencent.com/document/product/866/34937) 与 [通用表格识别](https://cloud.tencent.com/document/product/866/35869) 等 API，签名采用腾讯云 TC3-HMAC-SHA256。

## 功能

### 🔍 支持的识别类型（16 种）

| 分类 | 类型 | API |
|------|------|-----|
| 文字 | 高精度文字识别 | GeneralAccurateOCR |
| 文字 | 通用手写体识别 | GeneralHandwritingOCR |
| **表格** | **通用表格识别** | **GeneralTableOCR** |
| **表格** | **高精度表格识别** | **AdvancedGeneralTableOCR** |
| 票据 | 增值税发票识别 | BillOCR |
| 票据 | 增值税发票（新版） | VATInvoiceOCR |
| 票据 | 火车票识别 | TrainTicketOCR |
| 票据 | 航空行程单识别 | FlightItineraryOCR |
| 证件 | 身份证识别 | IDCardOCR |
| 证件 | 护照识别 | PassportOCR |
| 证件 | 驾驶证识别 | DriverLicenseOCR |
| 证件 | 银行卡识别 | BankCardOCR |
| 证件 | 营业执照识别 | BusinessLicenseOCR |
| 其他 | 车牌识别 | LicensePlateOCR |

### 📋 表格识别 → Excel

表格识别结果支持多种导出格式：

- **复制为 Excel**：使用富文本剪贴板（HTML + 纯文本），粘到 Excel/WPS 自动识别为表格，保留行列结构
- **复制为 Markdown**：Markdown 表格格式，粘到支持 Markdown 的编辑器
- **复制为 CSV**：CSV 格式（含 UTF-8 BOM），Excel 可直接打开
- **复制为 JSON**：结构化 JSON，便于程序处理
- 表格 HTML 预览：在插件内直接看到表格结构

### 🧾 结构化字段提取

发票/身份证/银行卡等证件类识别，自动提取关键字段：

- 字段可视化展示（key-value 列表）
- 一键复制为文本（`key: value` 格式）
- 一键复制为 JSON

### 🎨 UI 功能

- **类型下拉切换**：主窗口顶部下拉框直接切换识别类型
- 粘贴（Ctrl+V）、拖拽、点击选图自动识别
- 截图识别（rubick 环境支持时显示「截图」按钮）
- 识别历史（可选，最近 10 条，可恢复）
- 连接测试（设置里校验密钥）
- 深/浅主题自适应
- Rubick 关键词触发：`表格识别` / `发票识别` / `身份证识别` 等

## 需要准备

腾讯云密钥（OCR 有免费额度）：

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/) → **访问管理 → API 密钥管理 → 新建密钥**
2. 记下 `SecretId`（形如 `AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）和对应的 `SecretKey`

## 配置（3 个必填参数）

编辑 `config.js`，填入你的密钥即可：

```js
window.TC_OCR_CONFIG = {
  secretId: 'AKIDxxxxxx...',   // 你的 SecretId（必填）
  secretKey: 'xxxxxxxx...',    // 你的 SecretKey（必填）
  region: 'ap-guangzhou',      // 接口地域（必填）：ap-guangzhou / ap-beijing / ap-shanghai ...
  type: 'print'                // 可选：print | handwrite | table | invoice | idCard ...
};
```

> 也可以在插件右上角「设置」里直接填，效果相同；填写英文数字以外的字符请勿带空格。

## 安装

### 方式 1：一键脚本（推荐，本地开发用）

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

### 方式 2：NPM 安装（生产环境，根治依赖冲突）

```bash
npm install -g rubick-tencent-ocr
```

### 方式 3：手动安装

1. 把本文件夹复制到：
   ```
   %APPDATA%\rubick\rubick-plugins-new\node_modules\rubick-tencent-ocr
   ```
2. 编辑同目录下 `rubick-local-plugin.json`，在数组最前面加入本插件声明
3. 编辑同目录 `package.json`，在 `dependencies` 里加入：
   ```json
   "rubick-tencent-ocr": "file:./node_modules/rubick-tencent-ocr"
   ```
4. 重启 rubick。

> 反复重跑 install.ps1 会以最新内容覆盖本插件，不影响其他已装插件。

## 更新日志

### v0.2.0 (2026-09-19)
- **feat**: 新增 14 种 OCR 类型（表格/发票/身份证/银行卡/车牌/护照/驾驶证/营业执照/火车票/行程单等）
- **feat**: 表格识别结果可复制为 Excel/Markdown/CSV/JSON，粘 Excel 自动保留格式
- **feat**: 富文本剪贴板（HTML + 纯文本双写）
- **feat**: 结构化字段提取（发票/身份证等）+ 字段可视化展示
- **feat**: 类型下拉框直接在主窗口切换，无需打开设置
- **feat**: 新增 Rubick 关键词触发（`表格识别`/`发票识别`/`身份证识别` 等）
- **feat**: 主窗口可接收 `data.code` 自动切换识别类型

### v0.1.1 (2026-08-25)
- **fix**: Logo 绝对路径修复 + 安装冲突修复（npm/package.json 同步）
- **chore**: 拆分为独立项目，独立 git 仓库

### v0.1.0
- 初始版本：腾讯云 OCR 图片识别，TC3-HMAC-SHA256 签名，设置面板，识别历史

## 说明

- 图片以 Base64 发送，高精度版（GeneralAccurateOCR）支持 Base64 后不超过 10 MB 的图片，支持 PNG/JPG/JPEG/BMP/PDF 格式。
- 表格识别返回的 `Cells[]` 会转成 HTML `<table>`，支持 `rowspan`/`colspan`。
- 富文本剪贴板：Excel/WPS 粘 HTML 自动识别为表格，其他软件粘纯文本。
- 若未配置密钥，识别时会提示去设置；测试连接通过 = 密钥与签名正确。
- 卸载：删除 `rubick-tencent-ocr` 文件夹，并从 `rubick-local-plugin.json` 移除对应条目。
