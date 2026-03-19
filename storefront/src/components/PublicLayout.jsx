import { Link, NavLink, Outlet } from 'react-router-dom'
import { useShopAuth } from '../auth'
import { useShop } from '../shop'

const ADMIN_APP_URL = import.meta.env.VITE_ADMIN_APP_URL ?? 'http://127.0.0.1:5174'
const BRAND_LOGO_URL = import.meta.env.VITE_BRAND_LOGO_URL ?? ''

function PublicLayout() {
  const { cart } = useShop()
  const { customer, logout } = useShopAuth()
  const itemsCount = cart?.items_count ?? 0

  return (
    <main className="shop-shell">
      <header className="shop-header">
        <Link className="shop-brand" to="/" aria-label="Accueil ETS Taha Shop">
          <span className="brand-lockup">
            {BRAND_LOGO_URL ? (
              <img className="brand-logo" src={BRAND_LOGO_URL} alt="Logo ETS Taha Shop" />
            ) : (
              <span className="brand-mark" aria-hidden="true">
                ET
              </span>
            )}
            <span>
              <strong className="brand-title">Etablissement Taha</strong>
              <small className="brand-subtitle">Vente en ligne</small>
            </span>
          </span>
        </Link>
        <nav className="shop-nav">
          <NavLink to="/" end className={({ isActive }) => `shop-link${isActive ? ' active' : ''}`}>
            Accueil
          </NavLink>
          <NavLink to="/catalogue" className={({ isActive }) => `shop-link${isActive ? ' active' : ''}`}>
            Catalogue
          </NavLink>
          <NavLink to="/track-order" className={({ isActive }) => `shop-link${isActive ? ' active' : ''}`}>
            Suivi commande
          </NavLink>
          <NavLink to="/cart" className={({ isActive }) => `shop-link${isActive ? ' active' : ''}`}>
            Panier ({itemsCount})
          </NavLink>
          {customer ? (
            <>
              <NavLink to="/account" className={({ isActive }) => `shop-link${isActive ? ' active' : ''}`}>
                Mon compte
              </NavLink>
              <button className="button ghost" type="button" onClick={() => logout()}>
                Deconnexion
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => `shop-link${isActive ? ' active' : ''}`}>
                Connexion
              </NavLink>
              <NavLink to="/register" className={({ isActive }) => `shop-link${isActive ? ' active' : ''}`}>
                Inscription
              </NavLink>
            </>
          )}
          <a className="shop-link admin" href={ADMIN_APP_URL} target="_blank" rel="noreferrer">
            Back-office
          </a>
        </nav>
      </header>

      <Outlet />
    </main>
  )
}

export default PublicLayout
