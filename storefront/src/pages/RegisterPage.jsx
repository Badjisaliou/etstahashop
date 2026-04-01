import { useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useShopAuth } from '../auth'

function RegisterPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { customer, register, authError, setAuthError } = useShopAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' })
  const [saving, setSaving] = useState(false)
  const redirectTo = location.state?.from?.pathname ?? '/account'

  const formError = useMemo(() => {
    if (!form.name.trim() || !form.password) {
      return 'Nom et mot de passe requis.'
    }

    if (!form.email.trim() && !form.phone.trim()) {
      return 'Renseignez au moins un email ou un numero de telephone.'
    }

    if (form.password !== form.password_confirmation) {
      return 'La confirmation du mot de passe ne correspond pas.'
    }

    return ''
  }, [form.email, form.name, form.password, form.password_confirmation, form.phone])

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
      await register({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        password: form.password,
        password_confirmation: form.password_confirmation,
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
        <h2>Inscription client</h2>
        <p>Creez un compte pour suivre vos commandes depuis la boutique.</p>
      </div>
      {authError || formError ? <p className="message error">{authError || formError}</p> : null}
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          <span>Nom complet</span>
          <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
        </label>
        <label>
          <span>Email</span>
          <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
        </label>
        <label>
          <span>Telephone</span>
          <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="+221771234567" />
        </label>
        <label>
          <span>Mot de passe</span>
          <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
        </label>
        <label>
          <span>Confirmation</span>
          <input type="password" value={form.password_confirmation} onChange={(event) => setForm((current) => ({ ...current, password_confirmation: event.target.value }))} required />
        </label>
        <div className="action-row">
          <button className="button primary" type="submit" disabled={saving || Boolean(formError)}>
            {saving ? 'Creation...' : 'Creer mon compte'}
          </button>
          <Link className="button ghost" to="/login">J ai deja un compte</Link>
        </div>
      </form>
    </section>
  )
}

export default RegisterPage
