import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiRequest } from '../lib/api'

function formatPaymentMethod(value) {
  if (value === 'orange_money') {
    return 'Orange Money'
  }

  if (value === 'wave') {
    return 'Wave'
  }

  return value || 'Non renseigne'
}

function TrackOrderPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [form, setForm] = useState({
    order_number: searchParams.get('order_number') ?? '',
    email: searchParams.get('email') ?? '',
  })
  const [order, setOrder] = useState(null)
  const [paymentOption, setPaymentOption] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const formError = useMemo(() => {
    if (!form.order_number.trim() || !form.email.trim()) {
      return 'Le numero de commande et l email sont requis.'
    }

    return ''
  }, [form.email, form.order_number])

  async function handleSubmit(event) {
    event.preventDefault()

    if (formError) {
      setMessage(formError)
      return
    }

    try {
      setLoading(true)
      const response = await apiRequest('/orders/track', {
        method: 'POST',
        body: JSON.stringify({
          order_number: form.order_number.trim(),
          email: form.email.trim(),
        }),
      })

      setOrder(response.data)
      setPaymentOption(response.meta?.payment_option ?? null)
      setMessage('Commande retrouvee avec succes.')
      setSearchParams({ order_number: form.order_number.trim(), email: form.email.trim() })
    } catch (error) {
      setOrder(null)
      setPaymentOption(null)
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="shop-stack">
      <section className="panel">
        <div className="section-heading">
          <h2>Suivre une commande</h2>
          <p>Retrouve le statut de ta commande avec son numero et l email utilise lors du checkout.</p>
        </div>
        {message ? <p className={`message ${message.includes('succes') ? 'success' : 'error'}`}>{message}</p> : null}
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Numero de commande</span>
            <input value={form.order_number} placeholder="ETS-XXXXXXXXXX" onChange={(event) => setForm((current) => ({ ...current, order_number: event.target.value }))} />
          </label>
          <label>
            <span>Email</span>
            <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          </label>
          <div className="action-row">
            <button className="button primary" type="submit" disabled={loading || Boolean(formError)}>
              {loading ? 'Recherche...' : 'Suivre la commande'}
            </button>
          </div>
        </form>
      </section>

      {order ? (
        <section className="content-grid">
          <article className="panel">
            <div className="section-heading">
              <h2>{order.order_number}</h2>
              <p>{order.address?.full_name ?? 'Client'} - {order.address?.email ?? 'Email non disponible'}</p>
            </div>
            <div className="tracking-grid">
              <div className="check-card">
                <strong>Statut commande</strong>
                <p>{order.status}</p>
              </div>
              <div className="check-card">
                <strong>Statut paiement</strong>
                <p>{order.payment_status}</p>
              </div>
              <div className="check-card">
                <strong>Total</strong>
                <p>{order.total_amount} {order.currency}</p>
              </div>
            </div>

            <div className="order-summary-card tracking-card">
              <strong>Paiement {formatPaymentMethod(order.payment_method)}</strong>
              {paymentOption?.account_name ? <p>Beneficiaire: {paymentOption.account_name}</p> : null}
              {paymentOption?.account_number ? <p>Numero: {paymentOption.account_number}</p> : null}
              {paymentOption?.instructions ? <p>{paymentOption.instructions}</p> : null}
              <p>Reference de transfert: {order.payment_reference ?? 'Non renseignee'}</p>
              {order.payment_validated_at ? <p>Paiement valide le {new Date(order.payment_validated_at).toLocaleString()}</p> : <p>Le paiement n a pas encore ete valide par l administrateur.</p>}
            </div>
          </article>

          <article className="panel">
            <div className="section-heading">
              <h2>Articles commandes</h2>
              <p>{order.items?.length ?? 0} lignes.</p>
            </div>
            <div className="cart-list compact">
              {order.items?.map((item) => (
                <article className="cart-row" key={item.id}>
                  <div className="cart-row-main">
                    <strong>{item.product_name}</strong>
                    <span className="muted-line">Quantite {item.quantity}</span>
                  </div>
                  <div className="cart-row-side">
                    <strong>{item.line_total} {order.currency}</strong>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </section>
      ) : null}
    </div>
  )
}

export default TrackOrderPage
