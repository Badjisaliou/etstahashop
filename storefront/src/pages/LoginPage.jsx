import { useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useShopAuth } from '../auth'

function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { customer, login, authError, setAuthError } = useShopAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [saving, setSaving] = useState(false)
  const redirectTo = location.state?.from?.pathname ?? '/account'

  const formError = useMemo(() => {
    if (!form.email.trim() || !form.password.trim()) {
      return 'Email et mot de passe requis.'
    }

    return ''
  }, [form.email, form.password])

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
        email: form.email.trim(),
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
      {authError ? <p className="message error">{authError}</p> : null}
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          <span>Email</span>
          <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
        </label>
        <label>
          <span>Mot de passe</span>
          <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
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
