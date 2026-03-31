import { useEffect, useState } from 'react'
import { useShopAuth } from '../auth'
import { apiRequest } from '../lib/api'

function AccountPage() {
  const { customer, loadOrders } = useShopAuth()
  const [orders, setOrders] = useState([])
  const [paymentOptions, setPaymentOptions] = useState({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadAccount()
    loadPaymentOptions()
  }, [])

  async function loadAccount() {
    try {
      setLoading(true)
      const response = await loadOrders()
      setOrders(response.data ?? [])
      setMessage('')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadPaymentOptions() {
    try {
      const response = await apiRequest('/payment-options')
      setPaymentOptions(response.data ?? {})
    } catch {
      setPaymentOptions({})
    }
  }

  return (
    <div className="shop-stack">
      <section className="panel">
        <div className="section-heading">
          <h2>Mon compte</h2>
          <p>
            {customer?.name}
            {' - '}
            {customer?.email ?? customer?.phone ?? 'Contact non renseigne'}
          </p>
        </div>
        <p className="message info">Retrouvez ici vos commandes associees a votre compte client.</p>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Mes commandes</h2>
          <p>{loading ? 'Chargement...' : `${orders.length} commandes chargees.`}</p>
        </div>
        {message ? <p className="message error">{message}</p> : null}
        <div className="cart-list compact">
          {orders.map((order) => (
            <article className="cart-row" key={order.id}>
              <div className="cart-row-main">
                <strong>{order.order_number}</strong>
                <span className="muted-line">{order.status} - paiement {order.payment_status}</span>
                <span className="recipient-phone-inline">
                  Numero de transfert boutique: {paymentOptions[order.payment_method]?.account_number ?? 'Non renseigne'}
                </span>
              </div>
              <div className="cart-row-side">
                <strong>{order.total_amount} {order.currency}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default AccountPage
