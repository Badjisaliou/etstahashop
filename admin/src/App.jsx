import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import { AdminAuthProvider, useAdminAuth } from './auth'
import DashboardPage from './pages/DashboardPage'
import CategoriesPage from './pages/CategoriesPage'
import ProductsPage from './pages/ProductsPage'
import OrdersPage from './pages/OrdersPage'
import LoginPage from './pages/LoginPage'

function ProtectedRoute() {
  const location = useLocation()
  const { admin, loadingSession } = useAdminAuth()

  if (loadingSession) {
    return (
      <main className="app-shell">
        <section className="panel">
          <p>Chargement de la session admin...</p>
        </section>
      </main>
    )
  }

  if (!admin) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <AdminLayout />
}

function App() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  )
}

export default App
