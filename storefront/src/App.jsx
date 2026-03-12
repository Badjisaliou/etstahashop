import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import PublicLayout from './components/PublicLayout'
import { ShopAuthProvider, useShopAuth } from './auth'
import { ShopProvider } from './shop'
import AccountPage from './pages/AccountPage'
import CartPage from './pages/CartPage'
import CatalogPage from './pages/CatalogPage'
import CheckoutPage from './pages/CheckoutPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProductDetailPage from './pages/ProductDetailPage'
import RegisterPage from './pages/RegisterPage'
import TrackOrderPage from './pages/TrackOrderPage'

function ProtectedShopRoute() {
  const location = useLocation()
  const { customer, loadingSession } = useShopAuth()

  if (loadingSession) {
    return (
      <section className="panel">
        <p>Chargement de votre session...</p>
      </section>
    )
  }

  if (!customer) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

function App() {
  return (
    <ShopAuthProvider>
      <ShopProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalogue" element={<CatalogPage />} />
            <Route path="/products/:slug" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/track-order" element={<TrackOrderPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedShopRoute />}>
              <Route path="/account" element={<AccountPage />} />
            </Route>
          </Route>
        </Routes>
      </ShopProvider>
    </ShopAuthProvider>
  )
}

export default App
