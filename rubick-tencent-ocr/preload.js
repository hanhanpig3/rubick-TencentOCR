'use strict';
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');

const OCR_SERVICE = 'ocr';
const OCR_HOST = 'ocr.tencentcloudapi.com';
const OCR_VERSION = '2018-11-19';

function sha256Hex(data) {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}
function hmacSha256(key, data) {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}
function hmacSha256Hex(key, data) {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest('hex');
}

// 腾讯云 TC3-HMAC-SHA256 签名
function sign(secretKey, secretId, action, payloadStr) {
  const t = Math.floor(Date.now() / 1000);
  const date = new Date(t * 1000).toISOString().slice(0, 10);
  const ct = 'application/json; charset=utf-8';
  const service = OCR_SERVICE;
  const host = OCR_HOST;

  const canonicalHeaders =
    'content-type:' + ct + '\n' +
    'host:' + host + '\n' +
    'x-tc-action:' + action.toLowerCase() + '\n';
  const signedHeaders = 'content-type;host;x-tc-action';
  const hashedPayload = sha256Hex(payloadStr);
  const canonicalRequest =
    'POST\n/\n\n' + canonicalHeaders + '\n' + signedHeaders + '\n' + hashedPayload;
  const credentialScope = date + '/' + service + '/tc3_request';
  const stringToSign =
    'TC3-HMAC-SHA256\n' + t + '\n' + credentialScope + '\n' + sha256Hex(canonicalRequest);

  const secretDate = hmacSha256('TC3' + secretKey, date);
  const secretService = hmacSha256(secretDate, service);
  const secretSigning = hmacSha256(secretService, 'tc3_request');
  const signature = hmacSha256Hex(secretSigning, stringToSign);

  return {
    authorization:
      'TC3-HMAC-SHA256 Credential=' + secretId + '/' + credentialScope +
      ', SignedHeaders=' + signedHeaders +
      ', Signature=' + signature,
    t: t,
  };
}

// 调用腾讯云 OCR 接口
function recognize({ secretId, secretKey, region, imageBase64, type }) {
  // print -> 通用文字识别（高精度版）GeneralAccurateOCR（推荐，准确率更高）
  // handwrite -> 通用手写体识别 GeneralHandwritingOCR
  const action = type === 'handwrite' ? 'GeneralHandwritingOCR' : 'GeneralAccurateOCR';
  const payloadStr = JSON.stringify({ ImageBase64: imageBase64 });
  const { authorization, t } = sign(secretKey, secretId, action, payloadStr);

  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Host': OCR_HOST,
    'X-TC-Action': action,
    'X-TC-Timestamp': String(t),
    'X-TC-Version': OCR_VERSION,
    'X-TC-Region': region,
    'Authorization': authorization,
  };

  return new Promise(function (resolve, reject) {
    const req = https.request(
      { hostname: OCR_HOST, port: 443, path: '/', method: 'POST', headers },
      function (res) {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', function (c) { body += c; });
        res.on('end', function () {
          try {
            const json = JSON.parse(body);
            const resp = (json && json.Response) || {};
            if (resp.Error) {
              reject(new Error(resp.Error.Code + ': ' + resp.Error.Message));
              return;
            }
            resolve(resp);
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(25000, function () {
      req.destroy(new Error('请求超时'));
    });
    req.end(payloadStr);
  });
}

window.tcOcr = {
  sign: sign,
  recognize: recognize,
  readImageFile: function (filePath) {
    return fs.readFileSync(filePath).toString('base64');
  },
  // 把腾讯 OCR 响应转成文本（按行合并，去掉空行）
  textOf: function (resp) {
    const list = (resp && resp.TextDetections) || [];
    return list
      .map(function (d) { return (d && d.DetectedText) || ''; })
      .join('\n')
      .replace(/\n+/g, '\n')
      .replace(/^\n+|\n+$/g, '')
      .trim();
  },
};
