import { NavLink, Outlet } from 'react-router-dom'
import { useAdminAuth } from '../auth'

const BRAND_LOGO_URL = import.meta.env.VITE_BRAND_LOGO_URL ?? ''
const STOREFRONT_APP_URL = import.meta.env.VITE_STOREFRONT_APP_URL ?? ''

function AdminLayout() {
  const { admin, logout } = useAdminAuth()

  return (
    <main className="app-shell dashboard-layout">
      <section className="dashboard-header panel accent-panel">
        <div>
          <p className="eyebrow">Back Office</p>
          <div className="admin-brand-row">
            {BRAND_LOGO_URL ? (
              <img className="admin-brand-logo" src={BRAND_LOGO_URL} alt="Logo ETS Taha Shop" />
            ) : (
              <span className="admin-brand-mark" aria-hidden="true">
                ET
              </span>
            )}
            <div>
              <h1>Bonjour {admin?.name}</h1>
              <p className="lead">Admin ETS Taha Shop pour piloter le catalogue, les categories, les produits et les commandes.</p>
            </div>
          </div>
        </div>
        <div className="header-actions">
          {STOREFRONT_APP_URL ? (
            <a className="button ghost" href={STOREFRONT_APP_URL} target="_blank" rel="noreferrer">
              Voir la boutique
            </a>
          ) : null}
          <button className="button primary" type="button" onClick={() => logout()}>
            Se deconnecter
          </button>
        </div>
      </section>

      <nav className="panel nav-panel">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Tableau de bord
        </NavLink>
        <NavLink to="/categories" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Categories
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Produits
        </NavLink>
        <NavLink to="/orders" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Commandes
        </NavLink>
      </nav>

      <Outlet />
    </main>
  )
}

export default AdminLayout

