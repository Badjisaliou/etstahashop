$ErrorActionPreference = 'Stop'

function Invoke-JsonRequest {
  param(
    [string]$Method,
    [string]$Uri,
    [object]$Body = $null,
    [hashtable]$Headers = @{}
  )

  $params = @{
    Uri = $Uri
    Method = $Method
    Headers = $Headers
    ContentType = 'application/json'
  }

  if ($null -ne $Body) {
    $params.Body = ($Body | ConvertTo-Json -Depth 10)
  }

  Invoke-RestMethod @params
}

$sessionId = [guid]::NewGuid().ToString()
$email = 'smoke_' + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() + '@example.com'
$password = 'password123'

Write-Host '[1/10] Backend health'
$health = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/health' -Method GET
if ($health.message -notlike '*running*') { throw 'Health check backend invalide.' }

Write-Host '[2/10] Catalogue boutique'
$productsResponse = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/storefront/products' -Method GET
$products = @($productsResponse.data)
if ($products.Count -lt 1) { throw 'Aucun produit public disponible pour le smoke test.' }
$product = $products[0]

Write-Host '[3/10] Inscription client boutique'
$register = Invoke-JsonRequest -Method POST -Uri 'http://127.0.0.1:8000/api/storefront/auth/register' -Body @{
  name = 'Smoke Test'
  email = $email
  password = $password
  password_confirmation = $password
}
$shopToken = $register.data.token
$shopHeaders = @{ Authorization = "Bearer $shopToken"; Accept = 'application/json' }

Write-Host '[4/10] Session client boutique'
$me = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/storefront/auth/me' -Headers $shopHeaders -Method GET
if ($me.data.email -ne $email) { throw 'Le profil client retourne un email inattendu.' }

Write-Host '[5/10] Ajout panier'
$cartAdd = Invoke-JsonRequest -Method POST -Uri 'http://127.0.0.1:8000/api/storefront/cart/items' -Headers $shopHeaders -Body @{
  session_id = $sessionId
  product_id = $product.id
  quantity = 1
}
if (-not $cartAdd.data -or @($cartAdd.data.items).Count -lt 1) { throw 'Le panier n a pas ete cree correctement.' }
$cartItem = @($cartAdd.data.items)[0]

Write-Host '[6/10] Mise a jour panier'
$cartUpdate = Invoke-JsonRequest -Method PATCH -Uri ("http://127.0.0.1:8000/api/storefront/cart/items/{0}" -f $cartItem.id) -Headers $shopHeaders -Body @{
  session_id = $sessionId
  quantity = 1
}
if (-not $cartUpdate.data) { throw 'La mise a jour du panier a echoue.' }

Write-Host '[7/10] Checkout boutique'
$orderCreate = Invoke-JsonRequest -Method POST -Uri 'http://127.0.0.1:8000/api/storefront/orders' -Headers $shopHeaders -Body @{
  payment_method = 'wave'
  payment_reference = 'SMOKE-REF'
  notes = 'Smoke test order'
  address = @{
    full_name = 'Smoke Test'
    email = $email
    phone = '770000000'
    address_line_1 = 'Rue de test'
    address_line_2 = $null
    city = 'Dakar'
    state = $null
    postal_code = $null
    country = 'SN'
  }
  items = @(
    @{
      product_id = $product.id
      quantity = 1
    }
  )
}
$order = $orderCreate.data
if (-not $order.order_number) { throw 'La commande n a pas ete creee correctement.' }

Write-Host '[8/10] Historique client'
$orders = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/storefront/auth/orders' -Headers $shopHeaders -Method GET
if (-not (@($orders.data) | Where-Object { $_.order_number -eq $order.order_number })) { throw 'La commande n apparait pas dans l historique client.' }

Write-Host '[9/10] Login admin + lecture commandes'
$adminLogin = Invoke-JsonRequest -Method POST -Uri 'http://127.0.0.1:8000/api/admin/login' -Body @{
  email = 'admin@etstaha.shop'
  password = 'admin12345'
}
$adminToken = $adminLogin.data.token
$adminHeaders = @{ Authorization = "Bearer $adminToken"; Accept = 'application/json' }
$adminOrders = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/admin/orders?per_page=10' -Headers $adminHeaders -Method GET
if (-not (@($adminOrders.data) | Where-Object { $_.order_number -eq $order.order_number })) { throw 'La commande n apparait pas dans la liste admin.' }

Write-Host '[10/10] Logout client'
Invoke-JsonRequest -Method POST -Uri 'http://127.0.0.1:8000/api/storefront/auth/logout' -Headers $shopHeaders | Out-Null
$logoutRejected = $false
try {
  Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/storefront/auth/me' -Headers $shopHeaders -Method GET | Out-Null
} catch {
  $logoutRejected = $_.Exception.Response.StatusCode.value__ -eq 401
}
if (-not $logoutRejected) { throw 'La session client reste valide apres logout.' }

Write-Host ''
Write-Host 'Smoke test critique OK.'
Write-Host ("Client: {0}" -f $email)
Write-Host ("Commande: {0}" -f $order.order_number)
Write-Host ("Produit: {0}" -f $product.name)
