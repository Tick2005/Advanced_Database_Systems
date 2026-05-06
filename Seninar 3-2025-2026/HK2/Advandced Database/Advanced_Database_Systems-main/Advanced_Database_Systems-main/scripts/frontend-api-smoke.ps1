param(
  [string]$BaseUrl = "http://localhost:8081/api",
  [string]$Email = "customer@hotel.local",
  [string]$Password = "Demo@123"
)

$ErrorActionPreference = "Stop"

function Invoke-JsonRequest {
  param(
    [string]$Method,
    [string]$Url,
    [object]$Body = $null,
    [hashtable]$Headers = @{},
    [int]$Retries = 5,
    [int]$DelaySeconds = 2
  )

  $payload = $null
  if ($null -ne $Body) {
    $payload = $Body | ConvertTo-Json -Depth 10
  }

  $requestParams = @{
    Method = $Method
    Uri = $Url
    Headers = $Headers
  }

  if ($payload) {
    $requestParams["Body"] = $payload
    $requestParams["ContentType"] = "application/json"
  }

  for ($attempt = 1; $attempt -le $Retries; $attempt++) {
    try {
      return Invoke-RestMethod @requestParams
    } catch {
      $message = $_.Exception.Message
      $isRetryable = $message -like "*(502)*" -or $message -like "*Unable to connect*" -or $message -like "*connection was closed*"

      if (-not $isRetryable -or $attempt -eq $Retries) {
        throw
      }

      Write-Host "[SMOKE] Retry $attempt/$Retries for $Method $Url because: $message"
      Start-Sleep -Seconds $DelaySeconds
    }
  }
}

Write-Host "[SMOKE] Login customer"
$login = Invoke-JsonRequest -Method Post -Url "$BaseUrl/auth/login" -Body @{
  email = $Email
  password = $Password
}
$token = $login.accessToken
if (-not $token -and $login.data) {
  $token = $login.data.accessToken
}
if (-not $token) {
  throw "Login failed: no accessToken returned"
}

$authHeaders = @{ Authorization = "Bearer $token" }

Write-Host "[SMOKE] Public endpoints"
Invoke-JsonRequest -Method Get -Url "$BaseUrl/public/rooms" | Out-Null
Invoke-JsonRequest -Method Get -Url "$BaseUrl/public/branches" | Out-Null

Write-Host "[SMOKE] Customer endpoints"
Invoke-JsonRequest -Method Get -Url "$BaseUrl/customer/profile" -Headers $authHeaders | Out-Null
Invoke-JsonRequest -Method Get -Url "$BaseUrl/customer/bookings" -Headers $authHeaders | Out-Null
Invoke-JsonRequest -Method Get -Url "$BaseUrl/customer/feedbacks/my" -Headers $authHeaders | Out-Null

Write-Host "[SMOKE] PASS - UI-linked API endpoints are reachable"
