import { NavLink, Outlet } from 'react-router-dom'
import { useAdminAuth } from '../auth'

function AdminLayout() {
  const { admin, logout } = useAdminAuth()

  return (
    <main className="app-shell dashboard-layout">
      <section className="dashboard-header panel accent-panel">
        <div>
          <p className="eyebrow">Back Office</p>
          <h1>Bonjour {admin?.name}</h1>
          <p className="lead">Admin ETS Taha Shop pour piloter le catalogue, les categories, les produits et les commandes.</p>
        </div>
        <div className="header-actions">
          <button className="button primary" type="button" onClick={() => logout()}>
            Se deconnecter
          </button>
        </div>
      </section>

      <nav className="panel nav-panel">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Dashboard
        </NavLink>
        <NavLink to="/categories" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Categories
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Products
        </NavLink>
        <NavLink to="/orders" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Orders
        </NavLink>
      </nav>

      <Outlet />
    </main>
  )
}

export default AdminLayout

