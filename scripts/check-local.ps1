$ErrorActionPreference = 'Stop'

$checks = @(
  @{ Name = 'Backend health'; Url = 'http://127.0.0.1:8000/api/health'; Expect = 200 },
  @{ Name = 'Storefront'; Url = 'http://127.0.0.1:5173'; Expect = 200 },
  @{ Name = 'Admin'; Url = 'http://127.0.0.1:5174'; Expect = 200 }
)

$failed = $false

foreach ($check in $checks) {
  try {
    $response = Invoke-WebRequest -Uri $check.Url -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -ne $check.Expect) {
      $failed = $true
      Write-Host ("[FAIL] {0}: statut {1}" -f $check.Name, $response.StatusCode)
      continue
    }

    Write-Host ("[OK] {0}: {1}" -f $check.Name, $check.Url)

    if ($check.Name -eq 'Backend health') {
      $health = $response.Content | ConvertFrom-Json
      if ($null -ne $health.services) {
        $redisStatus = $health.services.redis.status
        $storageStatus = $health.services.storage.status
        $storageDisk = $health.services.storage.disk
        Write-Host ("     Redis: {0}" -f $redisStatus)
        Write-Host ("     Storage ({0}): {1}" -f $storageDisk, $storageStatus)
      }
    }
  } catch {
    $failed = $true
    Write-Host ("[FAIL] {0}: {1}" -f $check.Name, $_.Exception.Message)
  }
}

if ($failed) {
  exit 1
}

