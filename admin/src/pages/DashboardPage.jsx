import { useEffect, useState } from 'react'
import { apiRequest, API_BASE_URL } from '../lib/api'
import { useAdminAuth } from '../auth'
import StatusBanner from '../components/StatusBanner'

function DashboardPage() {
  const { token } = useAdminAuth()
  const [categoriesCount, setCategoriesCount] = useState(0)
  const [productsCount, setProductsCount] = useState(0)
  const [ordersCount, setOrdersCount] = useState(0)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [])

  async function loadMetrics() {
    try {
      setLoading(true)
      const [categoriesResponse, productsResponse, ordersResponse] = await Promise.all([
        apiRequest('/categories', {}, token),
        apiRequest('/products', {}, token),
        apiRequest('/orders', {}, token),
      ])

      setCategoriesCount(categoriesResponse.total ?? categoriesResponse.data?.length ?? 0)
      setProductsCount(productsResponse.total ?? productsResponse.data?.length ?? 0)
      setOrdersCount(ordersResponse.total ?? ordersResponse.data?.length ?? 0)
      setMessage('Vue d ensemble chargee avec succes.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <StatusBanner message={message} tone={message.includes('succes') ? 'success' : 'info'} />
      <section className="stats-grid">
        <article className="stat-card panel">
          <span className="stat-label">Categories</span>
          <strong>{loading ? '...' : categoriesCount}</strong>
        </article>
        <article className="stat-card panel">
          <span className="stat-label">Produits</span>
          <strong>{loading ? '...' : productsCount}</strong>
        </article>
        <article className="stat-card panel">
          <span className="stat-label">Commandes</span>
          <strong>{loading ? '...' : ordersCount}</strong>
        </article>
        <article className="stat-card panel">
          <span className="stat-label">API</span>
          <strong className="small-strong">{API_BASE_URL}</strong>
        </article>
      </section>

      <section className="content-grid single-column">
        <article className="panel">
          <div className="section-heading">
            <h2>Phase 2 en cours</h2>
            <p>Le back-office couvre maintenant le catalogue, les images, les commandes et le socle e-commerce.</p>
          </div>
          <div className="check-grid">
            <div className="check-card">
              <strong>Auth admin</strong>
              <p>Session Bearer token avec login, me et logout.</p>
            </div>
            <div className="check-card">
              <strong>Catalogue</strong>
              <p>Categories et produits admin avec filtres, statuts et upload image.</p>
            </div>
            <div className="check-card">
              <strong>Commandes</strong>
              <p>Validation stock, totaux, statuts commande et paiement disponibles.</p>
            </div>
          </div>
        </article>
      </section>
    </>
  )
}

export default DashboardPage

