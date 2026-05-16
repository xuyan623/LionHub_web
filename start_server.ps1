[CmdletBinding()]
param(
  [ValidateSet("start", "ensure-deps", "help")]
  [string]$Action = "help"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$venvPath = Join-Path $projectRoot ".venv"
$pythonPath = Join-Path $venvPath "Scripts\python.exe"
$requirementsPath = Join-Path $projectRoot "requirements.txt"

function Ensure-Venv {
  if (-not (Test-Path $pythonPath)) {
    python -m venv $venvPath
  }
}

function Test-PythonPackagesReady {
  try {
    & $pythonPath -c "import fastapi, uvicorn, multipart" | Out-Null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

function Ensure-PythonDependencies {
  Ensure-Venv

  if (Test-PythonPackagesReady) {
    Write-Host "[i] Python dependencies unchanged"
    return
  }

  & $pythonPath -m pip install --upgrade pip
  & $pythonPath -m pip install -r $requirementsPath
}

function Start-Server {
  Ensure-PythonDependencies
  Set-Location $projectRoot
  & $pythonPath -m uvicorn server:app --host 0.0.0.0 --port 4173
}

function Show-Usage {
  Write-Host "Usage: .\start_server.ps1 <start|ensure-deps|help>"
  Write-Host ""
  Write-Host "  start        创建/更新虚拟环境并启动本地服务"
  Write-Host "  ensure-deps  仅创建/更新虚拟环境依赖，不启动服务"
  Write-Host "  help         显示此帮助"
}

switch ($Action) {
  "start" {
    Start-Server
    break
  }
  "ensure-deps" {
    Ensure-PythonDependencies
    break
  }
  default {
    Show-Usage
    break
  }
}
