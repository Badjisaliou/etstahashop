import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useShopAuth } from '../auth'
import { apiRequest } from '../lib/api'
import { useShop } from '../shop'

const BRAND_LOGO_URL = import.meta.env.VITE_BRAND_LOGO_URL ?? ''
const SHOP_CONTACT_EMAIL = 'etstahashop@gmail.com'
const SHOP_CONTACT_PHONE = import.meta.env.VITE_SHOP_CONTACT_PHONE ?? '+221 77 000 00 00'

function PublicLayout() {
  const { cart } = useShop()
  const { customer, logout } = useShopAuth()
  const itemsCount = cart?.items_count ?? 0
  const [paymentOptions, setPaymentOptions] = useState({})

  useEffect(() => {
    loadPaymentOptions()
  }, [])

  async function loadPaymentOptions() {
    try {
      const response = await apiRequest('/payment-options')
      setPaymentOptions(response.data ?? {})
    } catch {
      setPaymentOptions({})
    }
  }

  const transferNumber = useMemo(() => {
    return (
      paymentOptions?.wave?.account_number ??
      paymentOptions?.orange_money?.account_number ??
      SHOP_CONTACT_PHONE
    )
  }, [paymentOptions])

  return (
    <main className="shop-shell">
      <header className="shop-header">
        <div className="shop-header-top">
          <Link className="shop-brand" to="/" aria-label="Accueil ETS Taha Shop">
            <span className="brand-lockup prominent">
              {BRAND_LOGO_URL ? (
                <img className="brand-logo large" src={BRAND_LOGO_URL} alt="Logo ETS Taha Shop" />
              ) : (
                <span className="brand-mark large" aria-hidden="true">
                  ET
                </span>
              )}
              <span>
                <strong className="brand-title large">ETS TAHA SHOP</strong>
                <small className="brand-subtitle">Vente en ligne • E-commerce</small>
              </span>
            </span>
          </Link>
          <div className="shop-contact-block">
            <a className="shop-contact-link" href={`mailto:${SHOP_CONTACT_EMAIL}`}>{SHOP_CONTACT_EMAIL}</a>
            <span className="shop-contact-link">Numero de transfert: {transferNumber}</span>
          </div>
        </div>
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
        </nav>
      </header>

      <Outlet />

      <footer className="shop-footer">
        <div>
          <strong>ETS TAHA SHOP</strong>
          <p>Votre boutique de vente en ligne.</p>
        </div>
        <div className="shop-footer-contact">
          <a className="shop-contact-link" href={`mailto:${SHOP_CONTACT_EMAIL}`}>{SHOP_CONTACT_EMAIL}</a>
          <span className="shop-contact-link">Numero de transfert: {transferNumber}</span>
        </div>
      </footer>
    </main>
  )
}

export default PublicLayout
