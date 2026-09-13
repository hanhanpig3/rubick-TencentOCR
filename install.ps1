# ============================================================
#  rubick-tencent-ocr (腾讯OCR) one-click install for rubick
#  v0.1.1 — 修复 Logo 绝对路径 + 同步 package.json 依赖
#
#  Usage: right-click -> "Run with PowerShell", or:
#    powershell -ExecutionPolicy Bypass -File .\install.ps1
# ============================================================
$ErrorActionPreference = 'Stop'

$pluginDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pluginName = 'rubick-tencent-ocr'
$srcDir = Join-Path $pluginDir $pluginName
if (-not (Test-Path -LiteralPath $srcDir)) {
  Write-Host "[ERROR] plugin folder not found: $srcDir" -ForegroundColor Red
  Write-Host "Please keep install.ps1 and the '$pluginName' folder side by side." -ForegroundColor Red
  exit 1
}

# ── 1) locate rubick plugin directory ──────────────────────
$baseDir = Join-Path $env:APPDATA 'rubick\rubick-plugins-new'
if (-not (Test-Path -LiteralPath $baseDir)) {
  Write-Host "[ERROR] rubick plugin dir not found: $baseDir" -ForegroundColor Red
  Write-Host "Please install and run rubick once, then try again." -ForegroundColor Red
  exit 1
}

$target = Join-Path $baseDir "node_modules\$pluginName"

# ── 2) copy plugin into node_modules ──────────────────────
Write-Host "[1/4] Copying plugin to $target" -ForegroundColor Cyan
if (Test-Path -LiteralPath $target) {
  Remove-Item -LiteralPath $target -Recurse -Force
}
Copy-Item -LiteralPath $srcDir -Destination $target -Recurse -Force

# ── 3) read package.json, resolve logo to absolute path ───
$pkgRaw = [System.IO.File]::ReadAllText((Join-Path $srcDir 'package.json'), [System.Text.Encoding]::UTF8)
$pkg = $pkgRaw | ConvertFrom-Json

# 把相对 logo 路径转为 file:// 绝对路径，rubick 主窗口搜索栏需要用
$logoRel = $pkg.logo  # e.g. "logo.png"
$logoAbs = "file:///" + ((Join-Path $target $logoRel) -replace '\\','/')
Write-Host "       Logo resolved: $logoAbs" -ForegroundColor DarkGray

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
  isdownload = $false
  isloading  = $false
}

# ── 4a) register into rubick-local-plugin.json (dedupe) ───
$configPath = Join-Path $baseDir 'rubick-local-plugin.json'
Write-Host "[2/4] Registering plugin in $configPath" -ForegroundColor Cyan
if (Test-Path -LiteralPath $configPath) {
  $raw = [System.IO.File]::ReadAllText($configPath, [System.Text.Encoding]::UTF8)
  $parsed = $raw | ConvertFrom-Json
  $list = @($parsed)
} else {
  $list = @()
}
$list = @($list | Where-Object { $_.name -ne $pluginName })
$list = @($entry) + $list
$json = $list | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($configPath, $json, (New-Object System.Text.UTF8Encoding($false)))

# ── 4b) sync baseDir/package.json dependencies ────────────
#  npm install 官方插件时会清理 node_modules 中未注册在 dependencies 的包
#  手动安装的插件必须写入 dependencies，否则会被 npm 清除
$pkgJsonPath = Join-Path $baseDir 'package.json'
Write-Host "[3/4] Syncing $pkgJsonPath dependencies" -ForegroundColor Cyan
if (Test-Path -LiteralPath $pkgJsonPath) {
  $basePkgRaw = [System.IO.File]::ReadAllText($pkgJsonPath, [System.Text.Encoding]::UTF8)
  $basePkg = $basePkgRaw | ConvertFrom-Json
} else {
  $basePkg = @{ dependencies = @{} }
}
if (-not $basePkg.dependencies) {
  $basePkg | Add-Member -NotePropertyName 'dependencies' -NotePropertyValue @{} -Force
}
# 用 file: 协议指向本地 node_modules 中的插件，npm 会识别此依赖而不删除
$basePkg.dependencies | Add-Member -NotePropertyName $pluginName -NotePropertyValue "file:./node_modules/$pluginName" -Force
$basePkgJson = $basePkg | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($pkgJsonPath, $basePkgJson, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "       Added: `"$pluginName`": `"file:./node_modules/$pluginName`"" -ForegroundColor DarkGray

Write-Host "[4/4] Done!" -ForegroundColor Green
Write-Host ""
Write-Host "Now fully quit rubick and reopen it." -ForegroundColor Yellow
Write-Host "Then type '腾讯ocr' / '腾讯识别' / 'tocr' to use it." -ForegroundColor Yellow
