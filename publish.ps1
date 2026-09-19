# ============================================================
#  rubick-tencent-ocr 发布到 npm
#
#  Usage: right-click -> "Run with PowerShell", or:
#    powershell -ExecutionPolicy Bypass -File .\publish.ps1
#
#  前置条件：
#    1. 已 npm login（有 npm 账号且已登录）
#    2. 当前目录在插件根目录（与 package.json 同级）
# ============================================================
$ErrorActionPreference = 'Stop'

$pluginDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pluginFolder = Join-Path $pluginDir 'rubick-tencent-ocr'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " rubick-tencent-ocr 发布到 npm" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── 1) 检查 npm 是否可用 ──────────────────────────────────
Write-Host "[1/4] 检查 npm..." -ForegroundColor Yellow
try {
  $npmVersion = & npm --version 2>&1
  if ($LASTEXITCODE -ne 0) { throw "npm not found" }
  Write-Host "       npm 版本: $npmVersion" -ForegroundColor DarkGray
} catch {
  Write-Host "[ERROR] npm 未安装或不可用: $_" -ForegroundColor Red
  Write-Host "       请安装 Node.js: https://nodejs.org/" -ForegroundColor Yellow
  exit 1
}

# ── 2) 检查 npm 登录状态 ──────────────────────────────────
Write-Host "[2/4] 检查 npm 登录状态..." -ForegroundColor Yellow
$whoami = & npm whoami 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "[ERROR] 未登录 npm: $whoami" -ForegroundColor Red
  Write-Host "       请先运行: npm login" -ForegroundColor Yellow
  Write-Host "       或使用 token: npm login --registry https://registry.npmjs.org" -ForegroundColor Yellow
  exit 1
}
Write-Host "       当前用户: $whoami" -ForegroundColor DarkGray

# ── 3) 检查包名是否已存在 ──────────────────────────────────
Write-Host "[3/4] 检查包名..." -ForegroundColor Yellow
$pkgRaw = [System.IO.File]::ReadAllText((Join-Path $pluginFolder 'package.json'), [System.Text.Encoding]::UTF8)
$pkg = $pkgRaw | ConvertFrom-Json
$packageName = $pkg.name
$packageVersion = $pkg.version
Write-Host "       包名: $packageName" -ForegroundColor DarkGray
Write-Host "       版本: $packageVersion" -ForegroundColor DarkGray

# 检查包名是否已被占用
& npm view "$packageName" version 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
  $existingVersion = & npm view "$packageName" version 2>&1
  Write-Host "       注意: 包名已存在，当前线上版本: $existingVersion" -ForegroundColor DarkYellow
  Write-Host "       确认要发布新版本吗？(y/N): " -NoNewline -ForegroundColor Cyan
  $confirm = Read-Host
  if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "已取消发布。" -ForegroundColor Yellow
    exit 0
  }
} else {
  Write-Host "       包名可用，可以首次发布" -ForegroundColor DarkGreen
}

# ── 4) 发布 ──────────────────────────────────────────────
Write-Host "[4/4] 发布到 npm..." -ForegroundColor Yellow
Write-Host ""

Push-Location $pluginFolder
try {
  # 先 pack 看看会发哪些文件
  Write-Host "       预览要发布的文件..." -ForegroundColor DarkGray
  & npm pack --dry-run 2>&1 | Write-Host

  Write-Host ""
  Write-Host "       开始发布..." -ForegroundColor DarkGray
  & npm publish --access public 2>&1 | Write-Host
  if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] 发布失败" -ForegroundColor Red
    exit 1
  }
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " 发布成功！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "npm 包地址: https://www.npmjs.com/package/$packageName" -ForegroundColor Cyan
Write-Host "安装命令: npm install -g $packageName" -ForegroundColor Cyan
Write-Host ""
Write-Host "现在可以在 rubick 市场直接安装此插件了！" -ForegroundColor Yellow
