param(
  [switch]$NoStorefront,
  [switch]$NoAdmin,
  [switch]$NoBackend
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$stateDir = Join-Path $root '.local'
$pidFile = Join-Path $stateDir 'dev-processes.json'
$logDir = Join-Path $stateDir 'logs'
$phpExe = (Get-Command php).Source
$npmExe = (Get-Command npm.cmd).Source

New-Item -ItemType Directory -Force $stateDir, $logDir | Out-Null

function Start-AppProcess {
  param(
    [string]$Name,
    [string]$FilePath,
    [string[]]$Arguments,
    [string]$WorkingDirectory
  )

  $stdout = Join-Path $logDir ("$Name.out.log")
  $stderr = Join-Path $logDir ("$Name.err.log")

  $escapedFilePath = '"' + $FilePath + '"'
  $escapedArgs = ($Arguments | ForEach-Object { '"' + $_ + '"' }) -join ' '
  $escapedStdout = '"' + $stdout + '"'
  $escapedStderr = '"' + $stderr + '"'
  $cmdArgs = "/c $escapedFilePath $escapedArgs 1>>$escapedStdout 2>>$escapedStderr"

  $processInfo = New-Object System.Diagnostics.ProcessStartInfo
  $processInfo.FileName = 'cmd.exe'
  $processInfo.Arguments = $cmdArgs
  $processInfo.WorkingDirectory = $WorkingDirectory
  $processInfo.UseShellExecute = $false
  $processInfo.CreateNoWindow = $true

  $process = [System.Diagnostics.Process]::Start($processInfo)

  [PSCustomObject]@{
    name = $Name
    pid = [int]$process.Id
    workdir = $WorkingDirectory
    stdout = $stdout
    stderr = $stderr
  }
}

$processes = @()

if (-not $NoBackend) {
  $processes += Start-AppProcess -Name 'backend' -FilePath $phpExe -Arguments @('artisan', 'serve', '--host=127.0.0.1', '--port=8000') -WorkingDirectory (Join-Path $root 'backend')
}

if (-not $NoStorefront) {
  $processes += Start-AppProcess -Name 'storefront' -FilePath $npmExe -Arguments @('run', 'dev') -WorkingDirectory (Join-Path $root 'storefront')
}

if (-not $NoAdmin) {
  $processes += Start-AppProcess -Name 'admin' -FilePath $npmExe -Arguments @('run', 'dev') -WorkingDirectory (Join-Path $root 'admin')
}

$processes | ConvertTo-Json -Depth 3 | Out-File -FilePath $pidFile -Encoding utf8 -Force

Start-Sleep -Seconds 6

Write-Host 'Services demarres:'
$processes | ForEach-Object {
  Write-Host ("- {0} (PID {1})" -f $_.name, $_.pid)
}

Write-Host ''
Write-Host 'URLs attendues:'
if (-not $NoBackend) { Write-Host '- Backend: http://127.0.0.1:8000/api/health' }
if (-not $NoStorefront) { Write-Host '- Storefront: http://127.0.0.1:5173' }
if (-not $NoAdmin) { Write-Host '- Admin: http://127.0.0.1:5174' }
Write-Host ''
Write-Host ("Fichier PID: {0}" -f $pidFile)
Write-Host ("Logs: {0}" -f $logDir)
