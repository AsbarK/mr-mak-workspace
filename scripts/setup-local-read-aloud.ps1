$ErrorActionPreference = 'Stop'
$readRoot = Join-Path $PSScriptRoot '../.cache/read-aloud'
New-Item -ItemType Directory -Force $readRoot | Out-Null
$readPython = Join-Path $readRoot 'venv/Scripts/python.exe'
if (!(Test-Path -LiteralPath $readPython)) { python -m venv (Join-Path $readRoot 'venv') }
& $readPython -m pip install 'kokoro-onnx==0.6.1'
if ($LASTEXITCODE -ne 0) { throw 'Local voice installation failed' }
$readRelease = Invoke-RestMethod 'https://api.github.com/repos/thewh1teagle/kokoro-onnx/releases/tags/model-files-v1.1'
foreach ($readName in @('kokoro-v1.0.int8.onnx','voices-v1.0.bin')) {
  $readAsset = $readRelease.assets | Where-Object name -eq $readName
  $readFile = Join-Path $readRoot $readName
  if (!(Test-Path -LiteralPath $readFile)) { Invoke-WebRequest $readAsset.browser_download_url -OutFile $readFile }
  if ((Get-Item -LiteralPath $readFile).Length -ne $readAsset.size) { throw "Incomplete download: $readName" }
  if ($readAsset.digest -and $readAsset.digest.StartsWith('sha256:') -and (Get-FileHash -LiteralPath $readFile).Hash.ToLower() -ne $readAsset.digest.Substring(7)) { throw "Download hash mismatch: $readName" }
}
Write-Output 'Fixed voices ready: Michael (US man), Emma (UK woman). No app restart performed.'
