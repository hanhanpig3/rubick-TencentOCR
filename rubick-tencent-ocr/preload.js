'use strict';
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
let clipboard = null;
try {
  // Electron 环境提供 clipboard 模块；非 Electron 环境（如浏览器预览）降级为空
  clipboard = require('electron').clipboard;
} catch (e) {
  clipboard = null;
}

const OCR_SERVICE = 'ocr';
const OCR_HOST = 'ocr.tencentcloudapi.com';
const OCR_VERSION = '2018-11-19';

// ─────────────────────────────────────────────────────────────
//  支持的 OCR 类型
//  type -> { action, label, kind, category }
//  kind: 'text' | 'table' | 'structured'
//  category: 分组用（文字 / 表格 / 证件票据 / 其他）
// ─────────────────────────────────────────────────────────────
const TYPES = {
  // ── 文字识别 ─────────────────────────────────
  print:        { action: 'GeneralAccurateOCR',      label: '高精度文字识别',   kind: 'text',       category: '文字' },
  handwrite:    { action: 'GeneralHandwritingOCR',  label: '通用手写体识别',   kind: 'text',       category: '文字' },

  // ── 表格识别 ─────────────────────────────────
  table:        { action: 'GeneralTableOCR',        label: '通用表格识别',     kind: 'table',      category: '表格' },
  tableAdvanced:{ action: 'AdvancedGeneralTableOCR',label: '高精度表格识别',   kind: 'table',      category: '表格' },

  // ── 票据 ─────────────────────────────────────
  invoice:      { action: 'BillOCR',                label: '增值税发票识别',   kind: 'structured', category: '票据' },
  invoiceVAT:   { action: 'VATInvoiceOCR',          label: '增值税发票（新版）', kind: 'structured',category: '票据' },
  trainTicket:  { action: 'TrainTicketOCR',         label: '火车票识别',       kind: 'structured', category: '票据' },
  flightItinerary:{action: 'FlightItineraryOCR',   label: '航空行程单识别',   kind: 'structured', category: '票据' },

  // ── 证件 ─────────────────────────────────────
  idCard:       { action: 'IDCardOCR',              label: '身份证识别',       kind: 'structured', category: '证件' },
  passport:     { action: 'PassportOCR',            label: '护照识别',         kind: 'structured', category: '证件' },
  driverLicense:{ action: 'DriverLicenseOCR',       label: '驾驶证识别',       kind: 'structured', category: '证件' },
  bankCard:     { action: 'BankCardOCR',            label: '银行卡识别',       kind: 'structured', category: '证件' },
  businessLicense:{action: 'BusinessLicenseOCR',    label: '营业执照识别',     kind: 'structured', category: '证件' },

  // ── 其他 ─────────────────────────────────────
  licensePlate: { action: 'LicensePlateOCR',        label: '车牌识别',         kind: 'structured', category: '其他' },
};

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

// 调用腾讯云 OCR 接口；type 决定使用哪个 API Action
function recognize({ secretId, secretKey, region, imageBase64, type }) {
  const cfg = TYPES[type] || TYPES.print;
  const action = cfg.action;
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
    req.setTimeout(30000, function () {
      req.destroy(new Error('请求超时'));
    });
    req.end(payloadStr);
  });
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 把腾讯 OCR 文字响应转成纯文本（按行合并，去掉空行）
function textOf(resp) {
  const list = (resp && resp.TextDetections) || [];
  return list
    .map(function (d) { return (d && d.DetectedText) || ''; })
    .join('\n')
    .replace(/\n+/g, '\n')
    .replace(/^\n+|\n+$/g, '')
    .trim();
}

// 把表格响应转成 2D 数组（rows x cols），每个元素是 {text, rowspan, colspan}
// 或 null（被占用的格子）
function tableGridOf(resp) {
  const cells = (resp && resp.Cells) || [];
  if (!cells.length) return [];
  let maxRow = 0, maxCol = 0;
  for (const c of cells) {
    const r = (c.Row || 0) + (c.RowSpan || 1) - 1;
    const col = (c.Column || 0) + (c.ColSpan || 1) - 1;
    if (r > maxRow) maxRow = r;
    if (col > maxCol) maxCol = col;
  }
  const rows = maxRow + 1;
  const cols = maxCol + 1;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (const cell of cells) {
    const r = cell.Row || 0;
    const c = cell.Column || 0;
    const rs = cell.RowSpan || 1;
    const cs = cell.ColSpan || 1;
    grid[r][c] = { text: cell.Text || '', rowspan: rs, colspan: cs };
    for (let i = r; i < r + rs && i < rows; i++) {
      for (let j = c; j < c + cs && j < cols; j++) {
        if (i === r && j === c) continue;
        grid[i][j] = { _occupied: true };
      }
    }
  }
  return grid;
}

// 表格 → HTML <table>（Excel/WPS 粘贴自动识别为表格，保留结构）
function tableToHtml(resp, opts) {
  opts = opts || {};
  const grid = tableGridOf(resp);
  if (!grid.length) return '';
  const border = opts.border === false ? '' : ' style="border-collapse:collapse;width:100%"';
  const cellStyle = opts.cellStyle || 'border:1px solid #999;padding:4px 8px';
  let html = '<table' + border + '>';
  for (const row of grid) {
    html += '<tr>';
    for (const cell of row) {
      if (!cell || cell._occupied) continue;
      html += '<td';
      if (cell.rowspan > 1) html += ' rowspan="' + cell.rowspan + '"';
      if (cell.colspan > 1) html += ' colspan="' + cell.colspan + '"';
      html += ' style="' + cellStyle + '">' + escapeHtml(cell.text) + '</td>';
    }
    html += '</tr>';
  }
  html += '</table>';
  return html;
}

// 表格 → CSV（Excel 可打开，UTF-8 BOM 防乱码）
function tableToCsv(resp) {
  const grid = tableGridOf(resp);
  if (!grid.length) return '';
  const rows = [];
  for (const row of grid) {
    const out = [];
    for (const cell of row) {
      const text = (!cell || cell._occupied) ? '' : (cell.text || '');
      // CSV 转义：含逗号/引号/换行的字段加双引号，内部引号翻倍
      if (/[",\r\n]/.test(text)) {
        out.push('"' + text.replace(/"/g, '""') + '"');
      } else {
        out.push(text);
      }
    }
    rows.push(out.join(','));
  }
  // BOM 让 Excel 正确识别 UTF-8
  return '\uFEFF' + rows.join('\r\n');
}

// 表格 → Markdown 表格
function tableToMarkdown(resp) {
  const grid = tableGridOf(resp);
  if (!grid.length) return '';
  // Markdown 不支持 rowspan/colspan，先简单展开成平面表格
  const flatRows = [];
  for (const row of grid) {
    flatRows.push(row.map(function (cell) {
      if (!cell || cell._occupied) return '';
      return String(cell.text || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
    }));
  }
  const sep = flatRows[0].map(function () { return '---'; });
  return [flatRows[0].join(' | '), sep.join(' | ')].concat(
    flatRows.slice(1).map(function (r) { return r.join(' | '); })
  ).join('\n');
}

// 表格 → JSON（结构化，便于后续处理）
function tableToJson(resp) {
  const grid = tableGridOf(resp);
  return JSON.stringify(grid.map(function (row) {
    return row.map(function (cell) {
      if (!cell || cell._occupied) return null;
      return {
        text: cell.text || '',
        rowspan: cell.rowspan || 1,
        colspan: cell.colspan || 1,
      };
    });
  }), null, 2);
}

// 结构化字段提取：把响应里的扁平字符串字段抽出来
// 支持嵌套对象（如发票的 InvoiceHeader）和数组（如 InvoiceLines）
function fieldsOf(resp) {
  const fields = [];
  const resp2 = resp || {};
  const skip = ['RequestId'];

  function walk(obj, prefix) {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (skip.indexOf(key) >= 0) continue;
      const val = obj[key];
      const label = prefix ? prefix + ' / ' + key : key;
      if (val == null) continue;
      if (Array.isArray(val)) {
        // 数组：展开为多行
        val.forEach(function (item, idx) {
          if (item && typeof item === 'object') {
            walk(item, label + '[' + idx + ']');
          } else {
            fields.push({ key: label + '[' + idx + ']', value: String(item) });
          }
        });
      } else if (typeof val === 'object') {
        walk(val, label);
      } else {
        fields.push({ key: label, value: String(val) });
      }
    }
  }
  walk(resp2, '');
  return fields;
}

// 结构化字段 → 纯文本（key: value 格式）
function fieldsToText(fields) {
  return fields.map(function (f) { return f.key + ': ' + f.value; }).join('\n');
}

// 结构化字段 → JSON
function fieldsToJson(fields) {
  const obj = {};
  for (const f of fields) {
    obj[f.key] = f.value;
  }
  return JSON.stringify(obj, null, 2);
}

// 富文本剪贴板：Excel/Word 粘 HTML，其他软件粘纯文本
function copyRich(html, text) {
  if (!clipboard) return false;
  try {
    clipboard.write({ html: html, text: text });
    return true;
  } catch (e) {
    return false;
  }
}

// 纯文本剪贴板
function copyText(text) {
  if (!clipboard) return false;
  try {
    clipboard.writeText(text);
    return true;
  } catch (e) {
    return false;
  }
}

window.tcOcr = {
  TYPES: TYPES,
  sign: sign,
  recognize: recognize,
  readImageFile: function (filePath) {
    return fs.readFileSync(filePath).toString('base64');
  },
  textOf: textOf,
  tableGridOf: tableGridOf,
  tableToHtml: tableToHtml,
  tableToCsv: tableToCsv,
  tableToMarkdown: tableToMarkdown,
  tableToJson: tableToJson,
  fieldsOf: fieldsOf,
  fieldsToText: fieldsToText,
  fieldsToJson: fieldsToJson,
  copyRich: copyRich,
  copyText: copyText,
};
