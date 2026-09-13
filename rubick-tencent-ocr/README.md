# 腾讯OCR (rubick-tencent-ocr)

一个 [rubick](https://github.com/rubickCenter/rubick) 腾讯云 OCR 插件：图片 / 截图识别文本并一键复制，识别结果可合并为一行、可保存历史。

使用腾讯云 [通用文字识别（高精度版）](https://cloud.tencent.com/document/product/866/34937)（GeneralAccurateOCR，印刷体推荐，准确率更高）与 [通用手写体识别](https://cloud.tencent.com/document/product/866/36212)（GeneralHandwritingOCR），签名采用腾讯云 TC3-HMAC-SHA256。

## 功能

- **直接识别**：粘贴（Ctrl+V）、拖拽、点击选图均可自动识别，弹窗内即时展示文本
- **文件 / 图片快捷方式**：输入 `腾讯ocr` 或在 rubick 里选中图片后执行「腾讯ocr」直接识别该图片
- **截图识别**：在支持截屏的 rubick 环境中显示「截图」按钮，截取屏幕区域自动识别
- **复制与整理**：一键复制全部结果，或「合并行」把所有换行拼成一行
- **两种类型**：高精度文字识别（印刷体）/ 通用手写体识别（右上角设置里切换，默认高精度）
- **识别历史**：可选保存最近 10 条历史，点击任意一条可恢复结果
- **连接测试**：设置里可「测试连接」校验密钥是否正确

## 需要准备

腾讯云密钥（两月内各注册过，OCR 有免费额度）：

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/) → **访问管理 → API 密钥管理 → 新建密钥**
2. 记下 `SecretId`（形如 `AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）和对应的 `SecretKey`

## 配置（3 个必填参数）

编辑 `config.js`，填入你的密钥即可：

```js
window.TC_OCR_CONFIG = {
  secretId: 'AKIDxxxxxx...',   // 你的 SecretId（必填）
  secretKey: 'xxxxxxxx...',    // 你的 SecretKey（必填）
  region: 'ap-guangzhou',      // 接口地域（必填）：ap-guangzhou / ap-beijing / ap-shanghai ...
  type: 'print'                // 可选：print(高精度文字识别-印刷体) | handwrite(通用手写体)
};
```

> 也可以在插件右上角「设置」里直接填，效果相同；填写英文数字以外的字符请勿带空格。

## 安装（推荐，一键脚本）

`install.ps1` 会自动完成：

1. 把 `rubick-tencent-ocr` 文件夹拷贝到
   `%APPDATA%\rubick\rubick-plugins-new\node_modules\rubick-tencent-ocr`
2. 注册到 `rubick-local-plugin.json`（保留已有插件，只新增/更新本插件）
3. **自动将 logo 路径解析为绝对 `file://` 路径**（修复搜索栏 logo 不显示问题）
4. **自动同步 `rubick-plugins-new/package.json` 的 dependencies**（修复安装官方插件后手动插件被清除的问题）

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

完成后**完全退出并重新打开 rubick**，输入 `腾讯ocr` / `腾讯识别` 即可使用。

> 反复重跑 install.ps1 会以最新内容覆盖本插件，不影响其他已装插件。

## 更新日志

### v0.1.1 (2026-08-25)
- **fix**: install.ps1 自动将 logo 相对路径解析为绝对 `file://` 路径，修复 rubick 搜索栏/选项列表中 logo 不显示的问题
- **fix**: install.ps1 自动同步 `rubick-plugins-new/package.json` 的 dependencies，修复从官方市场安装其他插件后本插件被 npm 清除的问题
- **chore**: 两个插件拆分为独立项目目录，各自拥有独立 git 仓库

### v0.1.0
- 初始版本：腾讯云 OCR 图片识别，TC3-HMAC-SHA256 签名，设置面板，识别历史

## 说明

- 图片以 Base64 发送，高精度版（GeneralAccurateOCR）支持 Base64 后不超过 10 MB 的图片，支持 PNG/JPG/JPEG/BMP/PDF 格式。
- 文本识别结果按行输出并自动去掉空行；「合并行」会去掉所有换行。
- 若未配置密钥，识别时会提示去设置；测试连接通过 = 密钥与签名正确。
- 卸载：删除 `rubick-tencent-ocr` 文件夹，并从 `rubick-local-plugin.json` 移除对应条目。
