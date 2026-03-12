$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path (Join-Path $root '.local') 'dev-processes.json'
$ports = @(8000, 5173, 5174)
$stopped = $false

if (Test-Path $pidFile) {
  $processes = Get-Content $pidFile -Raw | ConvertFrom-Json

  foreach ($process in @($processes)) {
    try {
      Stop-Process -Id $process.pid -Force -ErrorAction Stop
      Write-Host ("Arret de {0} (PID {1})" -f $process.name, $process.pid)
      $stopped = $true
    } catch {
      Write-Host ("Processus deja arrete ou introuvable: {0} (PID {1})" -f $process.name, $process.pid)
    }
  }

  Remove-Item $pidFile -Force
}

if (-not $stopped) {
  $connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $_.LocalPort -in $ports } |
    Sort-Object -Property OwningProcess -Unique

  foreach ($connection in $connections) {
    try {
      Stop-Process -Id $connection.OwningProcess -Force -ErrorAction Stop
      Write-Host ("Arret du processus ecoutant sur le port {0} (PID {1})" -f $connection.LocalPort, $connection.OwningProcess)
      $stopped = $true
    } catch {
      Write-Host ("Impossible d arreter le PID {0} sur le port {1}" -f $connection.OwningProcess, $connection.LocalPort)
    }
  }
}

if (-not $stopped) {
  Write-Host 'Aucun service local a arreter.'
}
