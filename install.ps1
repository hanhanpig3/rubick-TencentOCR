# ============================================================
#  rubick-tencent-ocr (腾讯OCR) one-click install for rubick
#  v0.3.0 — npm link 模式，根治依赖冲突
#
#  Usage: right-click -> "Run with PowerShell", or:
#    powershell -ExecutionPolicy Bypass -File .\install.ps1
#
#  原理：用 npm link 创建符号链接（而非复制文件），
#  官方插件 npm install 时不会清理符号链接，依赖冲突根治。
# ============================================================
$ErrorActionPreference = 'Stop'

$pluginDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pluginName = 'rubick-tencent-ocr'
$srcDir = Join-Path $pluginDir $pluginName

if (-not (Test-Path -LiteralPath $srcDir)) {
  Write-Host "[ERROR] plugin folder not found: $srcDir" -ForegroundColor Red
  exit 1
}

try {
  $npmVersion = & npm --version 2>&1
  Write-Host "       npm version: $npmVersion" -ForegroundColor DarkGray
} catch {
  Write-Host "[ERROR] npm not found. Please install Node.js first." -ForegroundColor Red
  exit 1
}

$baseDir = Join-Path $env:APPDATA 'rubick\rubick-plugins-new'
if (-not (Test-Path -LiteralPath $baseDir)) {
  Write-Host "[ERROR] rubick plugin dir not found: $baseDir" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Installing $pluginName via npm link" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ── 1) npm link 全局注册 ────────────────────────────────
Write-Host "[1/4] npm link (global) in $srcDir" -ForegroundColor Cyan
Push-Location $srcDir
try {
  & npm link 2>&1 | Out-Null
  Write-Host "       Global link created" -ForegroundColor DarkGreen
} catch {
  Write-Host "[ERROR] npm link failed: $_" -ForegroundColor Red
  Pop-Location
  exit 1
} finally {
  Pop-Location
}

# ── 2) npm link 本地关联 ────────────────────────────────
Write-Host "[2/4] npm link $pluginName (local) in $baseDir" -ForegroundColor Cyan
$target = Join-Path $baseDir "node_modules\$pluginName"
if (Test-Path -LiteralPath $target) {
  $item = Get-Item -LiteralPath $target -Force
  if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
    Push-Location $baseDir
    & npm unlink $pluginName 2>&1 | Out-Null
    Pop-Location
  } else {
    Remove-Item -LiteralPath $target -Recurse -Force
  }
}
Push-Location $baseDir
try {
  & npm link $pluginName 2>&1 | Out-Null
  Write-Host "       Local symlink created" -ForegroundColor DarkGreen
} catch {
  Write-Host "[WARN] npm link local failed: $_" -ForegroundColor Yellow
} finally {
  Pop-Location
}

# ── 3) 读取 package.json 生成注册信息 ───────────────────
Write-Host "[3/4] Registering plugin in rubick-local-plugin.json" -ForegroundColor Cyan
$pkgRaw = [System.IO.File]::ReadAllText((Join-Path $srcDir 'package.json'), [System.Text.Encoding]::UTF8)
$pkg = $pkgRaw | ConvertFrom-Json

$logoRel = $pkg.logo
$logoAbs = "file:///" + ((Join-Path $target $logoRel) -replace '\\','/')
Write-Host "       Logo: $logoAbs" -ForegroundColor DarkGray

$entry = @{
  pluginName = $pkg.pluginName
  name       = $pkg.name
  pluginType = $pkg.pluginType
  description = $pkg.description
  author     = $pkg.author
  version    = $pkg.version
  homePage   = $pkg.homePage
  logo       = $logoAbs
  main       = $pkg.main
  preload    = $pkg.preload
  features   = $pkg.features
  isDev      = $true
  isdownload = $true
  isloading  = $false
}

# ── 4) 写入 rubick-local-plugin.json（去重） ────────────
$configPath = Join-Path $baseDir 'rubick-local-plugin.json'
if (Test-Path -LiteralPath $configPath) {
  $raw = [System.IO.File]::ReadAllText($configPath, [System.Text.Encoding]::UTF8)
  $parsed = $raw | ConvertFrom-Json
  $list = @($parsed)
} else {
  $list = @()
}
$newList = @($entry) + @($list | Where-Object { $_.name -ne $pluginName })
$json = $newList | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($configPath, $json, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "       Registered in $configPath" -ForegroundColor DarkGreen

Write-Host "[4/4] Done!" -ForegroundColor Green
Write-Host ""
Write-Host "Now fully quit rubick and reopen it." -ForegroundColor Yellow
Write-Host "Then type '腾讯ocr' / '表格识别' / '发票识别' to use it." -ForegroundColor Yellow
Write-Host ""
Write-Host "NOTE: npm link symlinks are NOT cleaned up by" -ForegroundColor DarkGray
Write-Host "      'npm install <official-plugin>'. No more conflicts!" -ForegroundColor DarkGray
