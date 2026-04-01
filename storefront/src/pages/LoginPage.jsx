import { useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useShopAuth } from '../auth'

function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { customer, login, authError, setAuthError } = useShopAuth()
  const [form, setForm] = useState({ login: '', password: '' })
  const [saving, setSaving] = useState(false)
  const redirectTo = location.state?.from?.pathname ?? '/account'

  const formError = useMemo(() => {
    if (!form.login.trim() || !form.password.trim()) {
      return 'Email ou telephone et mot de passe requis.'
    }

    return ''
  }, [form.login, form.password])

  if (customer) {
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (formError) {
      setAuthError(formError)
      return
    }

    try {
      setSaving(true)
      await login({
        login: form.login.trim(),
        password: form.password,
      })
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="panel form-panel">
      <div className="section-heading">
        <h2>Connexion client</h2>
        <p>Connectez-vous pour retrouver vos commandes et garder votre panier relie a votre compte.</p>
      </div>
      {authError || formError ? <p className="message error">{authError || formError}</p> : null}
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          <span>Email ou telephone</span>
          <input value={form.login} onChange={(event) => setForm((current) => ({ ...current, login: event.target.value }))} placeholder="+221771234567 ou client@email.com" required />
        </label>
        <label>
          <span>Mot de passe</span>
          <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
        </label>
        <div className="action-row">
          <button className="button primary" type="submit" disabled={saving || Boolean(formError)}>
            {saving ? 'Connexion...' : 'Se connecter'}
          </button>
          <Link className="button ghost" to="/register">Creer un compte</Link>
        </div>
      </form>
    </section>
  )
}

export default LoginPage
