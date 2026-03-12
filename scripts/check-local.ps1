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
  } catch {
    $failed = $true
    Write-Host ("[FAIL] {0}: {1}" -f $check.Name, $_.Exception.Message)
  }
}

if ($failed) {
  exit 1
}

