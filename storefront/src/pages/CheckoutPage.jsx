import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useShopAuth } from '../auth'
import { apiRequest } from '../lib/api'
import { useShop } from '../shop'

const initialForm = {
  full_name: '',
  email: '',
  phone: '',
  address_line_1: '',
  address_line_2: '',
  payment_method: 'wave',
  payment_reference: '',
  notes: '',
}

function CheckoutPage() {
  const navigate = useNavigate()
  const { token, customer } = useShopAuth()
  const { cart, sessionId, clearCart } = useShop()
  const [form, setForm] = useState(initialForm)
  const [paymentOptions, setPaymentOptions] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [createdOrder, setCreatedOrder] = useState(null)

  useEffect(() => {
    loadPaymentOptions()
  }, [])

  useEffect(() => {
    setForm((current) => ({
      ...current,
      full_name: current.full_name || customer?.name || '',
      email: current.email || customer?.email || '',
    }))
  }, [customer])

  const selectedPayment = paymentOptions[form.payment_method] ?? null
  const paymentLabel = selectedPayment?.label ?? (form.payment_method === 'orange_money' ? 'Orange Money' : 'Wave')

  const formError = useMemo(() => {
    if (!cart?.items?.length) {
      return 'Le panier est vide.'
    }

    if (!form.full_name.trim() || !form.email.trim() || !form.address_line_1.trim()) {
      return 'Merci de remplir les informations client et de livraison obligatoires.'
    }

    return ''
  }, [cart, form.address_line_1, form.email, form.full_name])

  async function loadPaymentOptions() {
    try {
      const response = await apiRequest('/payment-options')
      setPaymentOptions(response.data ?? {})
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (formError) {
      setMessage(formError)
      return
    }

    try {
      setSaving(true)
      const response = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          payment_method: form.payment_method,
          payment_reference: form.payment_reference || null,
          notes: form.notes || `Commande web session ${sessionId}`,
          address: {
            full_name: form.full_name,
            email: form.email,
            phone: form.phone || null,
            address_line_1: form.address_line_1,
            address_line_2: form.address_line_2 || null,
            city: 'Non renseignee',
            state: null,
            postal_code: null,
            country: 'SN',
          },
          items: cart.items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
        }),
      }, token)

      setCreatedOrder(response.data)
      setMessage('Commande creee avec succes.')
      await clearCart()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (!cart?.items?.length && !createdOrder) {
    return (
      <section className="panel empty-state">
        <p>Le panier est vide pour le moment.</p>
        <button className="button primary" type="button" onClick={() => navigate('/catalogue')}>
          Retour au catalogue
        </button>
      </section>
    )
  }

  if (createdOrder) {
    const confirmedPayment = paymentOptions[createdOrder.payment_method] ?? null
    const trackOrderSearch = new URLSearchParams({
      order_number: createdOrder.order_number,
      email: createdOrder.address?.email ?? form.email,
    }).toString()

    return (
      <section className="panel success-panel">
        <p className="eyebrow">Commande validee</p>
        <h2>{createdOrder.order_number}</h2>
        <p>Votre commande a ete enregistree avec un montant total de {createdOrder.total_amount} {createdOrder.currency}.</p>
        <p className="hint">Un email de confirmation a ete envoye a {createdOrder.address?.email ?? form.email}.</p>
        <div className="recipient-phone-card compact">
          <span className="recipient-phone-label">Numero de transfert boutique</span>
          <strong className="recipient-phone-value">{confirmedPayment?.account_number ?? 'Non renseigne'}</strong>
        </div>
        <p className="hint">Paiement attendu par {confirmedPayment?.label ?? paymentLabel} puis validation manuelle par l administrateur.</p>
        {confirmedPayment?.account_name ? <p className="hint">Compte beneficiaire: {confirmedPayment.account_name}</p> : null}
        {confirmedPayment?.account_number ? <p className="hint">Numero de transfert: {confirmedPayment.account_number}</p> : null}
        {createdOrder.payment_reference ? <p className="hint">Reference transmise: {createdOrder.payment_reference}</p> : null}
        <div className="hero-actions">
          <Link className="button primary" to={`/track-order?${trackOrderSearch}`}>
            Suivre cette commande
          </Link>
          {customer ? <Link className="button ghost" to="/account">Voir mon compte</Link> : null}
        </div>
      </section>
    )
  }

  return (
    <section className="content-grid">
      <article className="panel">
        <div className="section-heading">
          <h2>Livraison et commande</h2>
          <p>Finalise la commande, puis effectue le transfert externe avant validation manuelle du paiement.</p>
        </div>
        {message ? <p className={`message ${message.includes('succes') ? 'success' : 'error'}`}>{message}</p> : null}
        <p className="message info">Le paiement ne se fait pas dans l application. Le client transfere le montant par Wave ou Orange Money, puis l administrateur valide la reception dans le back-office.</p>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Nom complet</span>
            <input value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} />
          </label>
          <label>
            <span>Email</span>
            <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          </label>
          <label>
            <span>Telephone</span>
            <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          </label>
          <label className="full-span">
            <span>Adresse</span>
            <input value={form.address_line_1} onChange={(event) => setForm((current) => ({ ...current, address_line_1: event.target.value }))} />
          </label>
          <label className="full-span">
            <span>Complement d adresse</span>
            <input value={form.address_line_2} onChange={(event) => setForm((current) => ({ ...current, address_line_2: event.target.value }))} />
          </label>
          <label>
            <span>Methode de paiement</span>
            <select value={form.payment_method} onChange={(event) => setForm((current) => ({ ...current, payment_method: event.target.value }))}>
              <option value="wave">Wave</option>
              <option value="orange_money">Orange Money</option>
            </select>
          </label>
          <label>
            <span>Reference de transfert</span>
            <input value={form.payment_reference} placeholder={`Reference ${paymentLabel} si disponible`} onChange={(event) => setForm((current) => ({ ...current, payment_reference: event.target.value }))} />
          </label>
          <label className="full-span">
            <span>Notes</span>
            <textarea rows="4" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </label>
          <div className="action-row checkout-submit-row">
            <button className="button primary" type="submit" disabled={saving || Boolean(formError)}>
              {saving ? 'Validation...' : 'Creer la commande'}
            </button>
          </div>
        </form>
      </article>

      <article className="panel checkout-summary-panel">
        <div className="section-heading">
          <h2>Recapitulatif</h2>
          <p>{cart.items_count} articles dans la commande.</p>
        </div>
        <div className="message info">
          Paiement choisi: {paymentLabel}. Une fois la commande creee, le client effectue le transfert en dehors de l application puis attend la confirmation admin.
        </div>
        <div className="recipient-phone-card compact">
          <span className="recipient-phone-label">Numero de transfert boutique</span>
          <strong className="recipient-phone-value">{selectedPayment?.account_number ?? 'Non renseigne'}</strong>
        </div>
        {selectedPayment ? (
          <div className="order-summary-card">
            <strong>{selectedPayment.label}</strong>
            {selectedPayment.account_name ? <p>Beneficiaire: {selectedPayment.account_name}</p> : null}
            {selectedPayment.account_number ? <p>Numero: {selectedPayment.account_number}</p> : null}
            {selectedPayment.instructions ? <p>{selectedPayment.instructions}</p> : null}
          </div>
        ) : null}
        <div className="cart-list compact">
          {cart.items.map((item) => (
            <article className="cart-row" key={item.id}>
              <div className="cart-row-main">
                <strong>{item.product?.name ?? 'Produit'}</strong>
                <span className="muted-line">Quantite {item.quantity}</span>
              </div>
              <div className="cart-row-side">
                <strong>{item.line_total} XOF</strong>
              </div>
            </article>
          ))}
        </div>
        <div className="order-totals">
          <span>Sous-total produits</span>
          <strong>{cart.subtotal_amount} XOF</strong>
        </div>
        <div className="order-totals muted-line">
          <span>Frais de livraison</span>
          <span>0 XOF</span>
        </div>
        <div className="order-totals muted-line">
          <span>Taxes</span>
          <span>0 XOF</span>
        </div>
        <div className="order-totals total-line">
          <strong>Total a transferer</strong>
          <strong>{cart.subtotal_amount} XOF</strong>
        </div>
      </article>
    </section>
  )
}

export default CheckoutPage
