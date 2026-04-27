import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useShopAuth } from '../auth'
import { apiRequest } from '../lib/api'
import { useShop } from '../shop'

const BRAND_LOGO_URL = import.meta.env.VITE_BRAND_LOGO_URL ?? ''
const SHOP_CONTACT_EMAIL = 'etstahashop@gmail.com'
const SHOP_CONTACT_PHONE = import.meta.env.VITE_SHOP_CONTACT_PHONE ?? '+221 76 990 94 66'

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm0 2v.3l8 5.2 8-5.2V8H4Zm16 8V10.7l-7.5 4.9a1 1 0 0 1-1.1 0L4 10.7V16h16Z" />
    </svg>
  )
}

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20.5 3.5A11.8 11.8 0 0 0 1.7 17.4L0 24l6.8-1.8a11.8 11.8 0 0 0 5.2 1.2h.1A11.9 11.9 0 1 0 20.5 3.5Zm-8.4 17.9h-.1c-1.7 0-3.4-.5-4.8-1.4l-.3-.2-4 .9 1-3.9-.2-.4a9.9 9.9 0 1 1 8.4 5Zm5.4-7.4c-.3-.2-1.6-.8-1.9-.9-.3-.1-.5-.2-.7.2-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.7-1.6-2-.2-.3 0-.4.1-.6l.5-.6c.2-.2.2-.4.3-.6 0-.2 0-.4 0-.5l-.8-1.9c-.2-.5-.4-.4-.7-.4H8c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.1 0 1.2.9 2.4 1 2.6.1.2 1.8 2.8 4.4 3.9.6.3 1.1.5 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.6-.7 1.8-1.4.2-.7.2-1.3.1-1.4-.1-.1-.3-.2-.6-.4Z" />
    </svg>
  )
}

function PublicLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { cart } = useShop()
  const { customer, logout } = useShopAuth()
  const itemsCount = cart?.items_count ?? 0
  const [paymentOptions, setPaymentOptions] = useState({})
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadPaymentOptions()
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 720) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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
    return paymentOptions?.wave?.account_number ?? paymentOptions?.orange_money?.account_number ?? SHOP_CONTACT_PHONE
  }, [paymentOptions])

  const whatsappLink = useMemo(() => {
  const cleanNumber = SHOP_CONTACT_PHONE.replace(/\D/g, '')
  const message = encodeURIComponent(
    "Bonjour ETS TAHA SHOP, je souhaite avoir plus d'informations sur vos produits."
  )

  return `https://wa.me/${cleanNumber}?text=${message}`
}, [])

  function handleSearch(event) {
    event.preventDefault()
    const params = new URLSearchParams()

    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim())
    }

    navigate(`/catalogue${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <main className="shop-shell">
      <header className="shop-header">
        <div className="market-topbar">
          <Link to="/track-order">Suivre une commande</Link>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            Assistance WhatsApp
          </a>
          <a href={`mailto:${SHOP_CONTACT_EMAIL}`}>Vendre avec ETS Taha</a>
        </div>
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
          <form className="market-search" onSubmit={handleSearch}>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cherchez un produit, une marque ou une categorie"
              aria-label="Rechercher un produit"
            />
            <button className="button primary search-button" type="submit">
              Rechercher
            </button>
          </form>
          <div className="shop-contact-block">
            <NavLink to={customer ? '/account' : '/login'} className="quick-action">
              <span>Compte</span>
              <strong>{customer ? 'Mon espace' : 'Connexion'}</strong>
            </NavLink>
            <a className="quick-action" href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <span>Aide</span>
              <strong>{SHOP_CONTACT_PHONE}</strong>
            </a>
            <NavLink to="/cart" className="quick-action cart-action">
              <span>Panier</span>
              <strong>{itemsCount} article{itemsCount > 1 ? 's' : ''}</strong>
            </NavLink>
          </div>
        </div>
        <button
          className="shop-nav-toggle"
          type="button"
          aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((current) => !current)}
        >
          {mobileMenuOpen ? 'Fermer' : 'Menu'}
        </button>
        <nav className={`shop-nav${mobileMenuOpen ? ' open' : ''}`}>
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
              <button className="button ghost" type="button" onClick={() => { logout(); setMobileMenuOpen(false) }}>
                Déconnexion
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
          <a className="shop-contact-item contact-pill" href={`mailto:${SHOP_CONTACT_EMAIL}`}>
            <span className="contact-icon"><MailIcon /></span>
            <span className="shop-contact-link">{SHOP_CONTACT_EMAIL}</span>
          </a>
          <a
  className="shop-contact-item contact-pill"
  href={whatsappLink}
  target="_blank"
  rel="noopener noreferrer"
>
  <span className="contact-icon"><WhatsappIcon /></span>
  <span className="shop-contact-link">{SHOP_CONTACT_PHONE}</span>
</a>
        </div>
      </footer>
    </main>
  )
}

export default PublicLayout
