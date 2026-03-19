import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import StatusBanner from '../components/StatusBanner'
import { useAdminAuth } from '../auth'

const BRAND_LOGO_URL = import.meta.env.VITE_BRAND_LOGO_URL ?? ''

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { admin, login, authError, setAuthError } = useAdminAuth()
  const [form, setForm] = useState({ email: 'admin@etstaha.shop', password: 'admin12345' })
  const [submitting, setSubmitting] = useState(false)

  if (admin) {
    return <Navigate to={location.state?.from?.pathname ?? '/dashboard'} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setAuthError('')

    try {
      await login(form)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="app-shell auth-layout">
      <section className="panel accent-panel">
        <p className="eyebrow">Administration ETS Taha Shop</p>
        <div className="admin-brand-row">
          {BRAND_LOGO_URL ? (
            <img className="admin-brand-logo" src={BRAND_LOGO_URL} alt="Logo ETS Taha Shop" />
          ) : (
            <span className="admin-brand-mark" aria-hidden="true">
              ET
            </span>
          )}
          <div>
            <h1>Connexion securisee back-office</h1>
            <p className="lead">
              Connecte-toi pour gerer les categories, les produits et les commandes avec une vue admin centralisee.
            </p>
          </div>
        </div>
        <ul className="feature-list">
          <li>Auth Bearer token</li>
          <li>CRUD categories et produits</li>
          <li>Validation commandes et paiements</li>
        </ul>
      </section>

      <section className="panel auth-panel">
        <h2>Connexion administrateur</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
            />
          </label>
          <label>
            <span>Mot de passe</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              required
            />
          </label>
          <StatusBanner message={authError} tone="error" />
          <button className="button primary full-width" type="submit" disabled={submitting}>
            {submitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <p className="hint">Compte seed par defaut: `admin@etstaha.shop` / `admin12345`</p>
      </section>
    </main>
  )
}

export default LoginPage

