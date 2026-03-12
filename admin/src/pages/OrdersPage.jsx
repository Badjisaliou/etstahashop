import { useEffect, useMemo, useState } from 'react'
import StatusBanner from '../components/StatusBanner'
import { useAdminAuth } from '../auth'
import { apiRequest } from '../lib/api'

const orderStatusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const paymentStatusOptions = ['pending', 'paid', 'failed', 'refunded']
const paymentMethodOptions = ['wave', 'orange_money']

const initialFilters = {
  search: '',
  status: 'all',
  paymentStatus: 'all',
  perPage: 10,
  page: 1,
}

function formatPaymentMethod(value) {
  if (value === 'orange_money') {
    return 'Orange Money'
  }

  if (value === 'wave') {
    return 'Wave'
  }

  return value || 'Non renseigne'
}

function OrdersPage() {
  const { token } = useAdminAuth()
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [filters, setFilters] = useState(initialFilters)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusForm, setStatusForm] = useState({ status: '', payment_status: '', payment_method: 'wave', payment_reference: '', notes: '' })
  const [feedback, setFeedback] = useState({ text: '', tone: 'info' })
  const [loading, setLoading] = useState(true)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const selectedOrderSummary = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? selectedOrder,
    [orders, selectedOrder, selectedOrderId],
  )

  useEffect(() => {
    loadOrders()
  }, [filters.page, filters.perPage, filters.status, filters.paymentStatus])

  async function loadOrders(customFilters = filters) {
    try {
      setLoading(true)

      const searchParams = new URLSearchParams({
        page: String(customFilters.page),
        per_page: String(customFilters.perPage),
      })

      if (customFilters.search.trim()) {
        searchParams.set('search', customFilters.search.trim())
      }

      if (customFilters.status !== 'all') {
        searchParams.set('status', customFilters.status)
      }

      if (customFilters.paymentStatus !== 'all') {
        searchParams.set('payment_status', customFilters.paymentStatus)
      }

      const response = await apiRequest(`/orders?${searchParams.toString()}`, {}, token)
      const nextOrders = response.data ?? []
      setOrders(nextOrders)
      setPagination({
        current_page: response.current_page ?? 1,
        last_page: response.last_page ?? 1,
        total: response.total ?? 0,
      })

      if (selectedOrderId) {
        const refreshedOrder = nextOrders.find((order) => order.id === selectedOrderId)
        if (!refreshedOrder) {
          setSelectedOrderId(null)
          setSelectedOrder(null)
          setStatusForm({ status: '', payment_status: '', payment_method: 'wave', payment_reference: '', notes: '' })
        }
      }

      setFeedback({ text: '', tone: 'info' })
    } catch (error) {
      setFeedback({ text: error.message, tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault()
    const nextFilters = { ...filters, page: 1 }
    setFilters(nextFilters)
    loadOrders(nextFilters)
  }

  async function selectOrder(orderId) {
    try {
      setDetailsLoading(true)
      setSelectedOrderId(orderId)
      const response = await apiRequest(`/orders/${orderId}`, {}, token)
      const order = response.data
      setSelectedOrder(order)
      setStatusForm({
        status: order.status ?? 'pending',
        payment_status: order.payment_status ?? 'pending',
        payment_method: order.payment_method ?? 'wave',
        payment_reference: order.payment_reference ?? '',
        notes: order.notes ?? '',
      })
      setFeedback({ text: 'Detail commande charge avec succes.', tone: 'info' })
    } catch (error) {
      setFeedback({ text: error.message, tone: 'error' })
    } finally {
      setDetailsLoading(false)
    }
  }

  async function handleStatusSubmit(event) {
    event.preventDefault()

    if (!selectedOrderId) {
      return
    }

    try {
      setSaving(true)
      const response = await apiRequest(
        `/orders/${selectedOrderId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: statusForm.status,
            payment_status: statusForm.payment_status,
            payment_method: statusForm.payment_method || null,
            payment_reference: statusForm.payment_reference || null,
            notes: statusForm.notes || null,
          }),
        },
        token,
      )

      setSelectedOrder(response.data)
      setStatusForm({
        status: response.data.status ?? 'pending',
        payment_status: response.data.payment_status ?? 'pending',
        payment_method: response.data.payment_method ?? 'wave',
        payment_reference: response.data.payment_reference ?? '',
        notes: response.data.notes ?? '',
      })
      setFeedback({ text: 'Commande mise a jour avec succes.', tone: 'success' })
      await loadOrders()
    } catch (error) {
      setFeedback({ text: error.message, tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <StatusBanner message={feedback.text} tone={feedback.tone} />
      <section className="content-grid">
        <article className="panel list-panel">
          <div className="section-heading">
            <h2>Commandes</h2>
            <p>{loading ? 'Chargement...' : `${pagination.total} commandes au total.`}</p>
          </div>

          <form className="filter-stack" onSubmit={handleSearchSubmit}>
            <div className="filter-row">
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Rechercher par numero, client, reference ou ville"
              />
              <select
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}
              >
                <option value="all">Tous les statuts</option>
                {orderStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-row">
              <select
                value={filters.paymentStatus}
                onChange={(event) => setFilters((current) => ({ ...current, paymentStatus: event.target.value, page: 1 }))}
              >
                <option value="all">Tous les paiements</option>
                {paymentStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <select
                value={filters.perPage}
                onChange={(event) => setFilters((current) => ({ ...current, perPage: Number(event.target.value), page: 1 }))}
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
              <button className="button secondary" type="submit">Filtrer</button>
            </div>
          </form>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Commande</th>
                  <th>Client</th>
                  <th>Montant</th>
                  <th>Paiement</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.order_number}</strong>
                      <div className="muted-line">{order.created_at ? new Date(order.created_at).toLocaleString() : 'Date indisponible'}</div>
                    </td>
                    <td>
                      <strong>{order.address?.full_name ?? 'Client inconnu'}</strong>
                      <div className="muted-line">{order.address?.phone ?? 'Sans telephone'}</div>
                    </td>
                    <td>
                      <strong>{order.total_amount} {order.currency}</strong>
                      <div className="muted-line">{order.status}</div>
                    </td>
                    <td>
                      <strong>{formatPaymentMethod(order.payment_method)}</strong>
                      <div className="muted-line">{order.payment_status}</div>
                      <div className="muted-line">{order.payment_reference ?? 'Sans reference'}</div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="mini-button" type="button" onClick={() => selectOrder(order.id)}>
                          Voir / Editer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-row">
            <button
              className="mini-button"
              type="button"
              disabled={pagination.current_page <= 1}
              onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
            >
              Precedent
            </button>
            <span>Page {pagination.current_page} / {pagination.last_page}</span>
            <button
              className="mini-button"
              type="button"
              disabled={pagination.current_page >= pagination.last_page}
              onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
            >
              Suivant
            </button>
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <h2>{selectedOrderSummary ? 'Detail et validation paiement' : 'Selectionner une commande'}</h2>
            <p>
              {selectedOrderSummary
                ? 'Verifier le transfert externe puis valider le paiement depuis l admin.'
                : 'Choisir une commande dans la liste pour afficher son detail.'}
            </p>
          </div>

          {selectedOrderSummary ? (
            <div className="order-detail-stack">
              <div className="order-summary-card">
                <strong>{selectedOrderSummary.order_number}</strong>
                <p>{selectedOrderSummary.address?.full_name ?? 'Client inconnu'} | {selectedOrderSummary.address?.city ?? 'Ville inconnue'}</p>
                <p>Total {selectedOrderSummary.total_amount} {selectedOrderSummary.currency}</p>
                <p>Paiement {formatPaymentMethod(selectedOrderSummary.payment_method)}</p>
                <p>Reference {selectedOrderSummary.payment_reference ?? 'Non renseignee'}</p>
                {selectedOrderSummary.payment_validated_at ? <p>Paiement valide le {new Date(selectedOrderSummary.payment_validated_at).toLocaleString()}</p> : null}
              </div>

              {detailsLoading ? (
                <p>Chargement du detail...</p>
              ) : selectedOrder ? (
                <>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Produit</th>
                          <th>SKU</th>
                          <th>Quantite</th>
                          <th>Prix</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items?.map((item) => (
                          <tr key={item.id}>
                            <td>{item.product_name}</td>
                            <td>{item.product_sku ?? '-'}</td>
                            <td>{item.quantity}</td>
                            <td>{item.unit_price}</td>
                            <td>{item.line_total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <form className="form-grid" onSubmit={handleStatusSubmit}>
                    <label>
                      <span>Statut commande</span>
                      <select value={statusForm.status} onChange={(event) => setStatusForm((current) => ({ ...current, status: event.target.value }))}>
                        {orderStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Statut paiement</span>
                      <select value={statusForm.payment_status} onChange={(event) => setStatusForm((current) => ({ ...current, payment_status: event.target.value }))}>
                        {paymentStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Methode de paiement</span>
                      <select value={statusForm.payment_method} onChange={(event) => setStatusForm((current) => ({ ...current, payment_method: event.target.value }))}>
                        {paymentMethodOptions.map((method) => (
                          <option key={method} value={method}>
                            {formatPaymentMethod(method)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Reference de transfert</span>
                      <input value={statusForm.payment_reference} onChange={(event) => setStatusForm((current) => ({ ...current, payment_reference: event.target.value }))} />
                    </label>
                    <label className="full-span">
                      <span>Notes admin</span>
                      <textarea rows="4" value={statusForm.notes} onChange={(event) => setStatusForm((current) => ({ ...current, notes: event.target.value }))} />
                    </label>
                    <div className="action-row">
                      <button className="button primary" type="submit" disabled={saving || detailsLoading}>
                        {saving ? 'Mise a jour...' : 'Valider la mise a jour'}
                      </button>
                    </div>
                  </form>
                </>
              ) : null}
            </div>
          ) : (
            <p className="hint">Aucune commande selectionnee.</p>
          )}
        </article>
      </section>
    </>
  )
}

export default OrdersPage

