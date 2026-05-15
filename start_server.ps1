$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$venvPath = Join-Path $projectRoot ".venv"
$pythonPath = Join-Path $venvPath "Scripts\\python.exe"

if (-not (Test-Path $pythonPath)) {
  python -m venv $venvPath
}

$packagesReady = $false
try {
  & $pythonPath -c "import fastapi, uvicorn, multipart" | Out-Null
  if ($LASTEXITCODE -eq 0) {
    $packagesReady = $true
  }
} catch {
  $packagesReady = $false
}

if (-not $packagesReady) {
  & $pythonPath -m pip install --upgrade pip
  & $pythonPath -m pip install -r (Join-Path $projectRoot "requirements.txt")
}

Set-Location $projectRoot
& $pythonPath -m uvicorn server:app --host 0.0.0.0 --port 4173
