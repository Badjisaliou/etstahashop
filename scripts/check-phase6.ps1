$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $root 'backend'
$envFile = Join-Path $backendDir '.env'

if (-not (Test-Path $envFile)) {
  Write-Host "[FAIL] backend/.env introuvable."
  exit 1
}

$envMap = @{}
Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith('#')) { return }
  $parts = $line -split '=', 2
  if ($parts.Length -eq 2) {
    $envMap[$parts[0].Trim()] = $parts[1].Trim().Trim('"')
  }
}

function Get-EnvValue {
  param([string]$Key, [string]$Default = '')
  if ($envMap.ContainsKey($Key)) { return $envMap[$Key] }
  return $Default
}

$failed = $false

$cacheStore = Get-EnvValue -Key 'CACHE_STORE' -Default 'database'
$queueConnection = Get-EnvValue -Key 'QUEUE_CONNECTION' -Default 'database'
$mediaDisk = Get-EnvValue -Key 'MEDIA_DISK' -Default 'public'
$redisClient = Get-EnvValue -Key 'REDIS_CLIENT' -Default 'phpredis'

Write-Host "CACHE_STORE=$cacheStore"
Write-Host "QUEUE_CONNECTION=$queueConnection"
Write-Host "MEDIA_DISK=$mediaDisk"
Write-Host "REDIS_CLIENT=$redisClient"
Write-Host ""

if ($cacheStore -in @('redis', 'failover')) {
  Write-Host "[OK] Cache compatible phase 6."
} else {
  Write-Host "[WARN] CACHE_STORE n'utilise pas redis/failover."
}

if ($queueConnection -eq 'redis') {
  Write-Host "[OK] Queue sur Redis."
} else {
  Write-Host "[WARN] Queue pas encore sur Redis."
}

if ($redisClient -eq 'phpredis') {
  $hasRedisExt = (php -m | Select-String -Pattern '^redis$' -SimpleMatch)
  if ($hasRedisExt) {
    Write-Host "[OK] Extension PHP redis detectee."
  } else {
    Write-Host "[WARN] Extension PHP redis absente."
  }
}

if ($redisClient -eq 'predis') {
  if (Test-Path (Join-Path $backendDir 'vendor\\predis\\predis')) {
    Write-Host "[OK] Client predis installe."
  } else {
    Write-Host "[WARN] Client predis non installe dans vendor."
  }
}

if ($mediaDisk -eq 's3') {
  $awsRequired = @('AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_DEFAULT_REGION', 'AWS_BUCKET')
  $missing = @()
  foreach ($key in $awsRequired) {
    $value = Get-EnvValue -Key $key
    if (-not $value) { $missing += $key }
  }

  if ($missing.Count -eq 0) {
    Write-Host "[OK] Variables AWS principales renseignees."
  } else {
    $failed = $true
    Write-Host ("[FAIL] Variables AWS manquantes: {0}" -f ($missing -join ', '))
  }
} else {
  Write-Host "[WARN] MEDIA_DISK n'est pas sur s3."
}

if ($failed) {
  exit 1
}
