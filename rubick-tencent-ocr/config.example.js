// ============================================================
//  腾讯OCR 配置模板
//
//  使用方法：
//  1. 复制本文件为 config.js（同目录）
//  2. 填入你的腾讯云 SecretId / SecretKey / Region
//  3. 重启 rubick
//
//  注意：config.js 已加入 .gitignore 和 .npmignore，不会被提交/发布。
// ============================================================
window.TC_OCR_CONFIG = {
  secretId: '',      // 腾讯云 SecretId（形如 AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx）
  secretKey: '',     // 腾讯云 SecretKey
  region: 'ap-guangzhou',  // 接口地域：ap-guangzhou / ap-beijing / ap-shanghai ...
  type: 'print'      // 默认识别类型：print | handwrite | table | invoice | idCard | bankCard | licensePlate ...
};
