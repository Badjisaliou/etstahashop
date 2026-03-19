import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../lib/api'
import { useShop } from '../shop'

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR').format(Number(value ?? 0))
}

function CatalogPage() {
  const { addToCart } = useShop()
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [pendingProductId, setPendingProductId] = useState(null)

  const filters = useMemo(
    () => ({
      search: searchParams.get('search') ?? '',
      category: searchParams.get('category') ?? '',
      page: Number(searchParams.get('page') ?? '1'),
    }),
    [searchParams],
  )

  useEffect(() => {
    loadCatalog()
  }, [filters.search, filters.category, filters.page])

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    const response = await apiRequest('/categories')
    setCategories(response.data ?? [])
  }

  async function loadCatalog() {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(filters.page) })

      if (filters.search.trim()) {
        params.set('search', filters.search.trim())
      }

      if (filters.category) {
        params.set('category', filters.category)
      }

      const response = await apiRequest(`/products?${params.toString()}`)
      setProducts(response.data ?? [])
      setPagination({
        current_page: response.current_page ?? 1,
        last_page: response.last_page ?? 1,
        total: response.total ?? 0,
      })
      setMessage('')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  function updateFilter(name, value) {
    const next = new URLSearchParams(searchParams)

    if (value) {
      next.set(name, value)
    } else {
      next.delete(name)
    }

    next.set('page', '1')
    setSearchParams(next)
  }

  function changePage(page) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(page))
    setSearchParams(next)
  }

  async function handleAddToCart(productId) {
    try {
      setPendingProductId(productId)
      await addToCart(productId, 1)
      setMessage('Produit ajoute au panier avec succes.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setPendingProductId(null)
    }
  }

  return (
    <div className="shop-stack">
      <section className="panel reveal-up">
        <div className="section-heading">
          <h2>Catalogue</h2>
          <p>{loading ? 'Chargement...' : `${pagination.total} produits trouves.`}</p>
        </div>
        {message ? <p className={`message ${message.includes('succes') ? 'success' : 'error'}`}>{message}</p> : null}
        <div className="filter-stack">
          <div className="filter-row">
            <input
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
              placeholder="Rechercher un produit"
            />
            <select value={filters.category} onChange={(event) => updateFilter('category', event.target.value)}>
              <option value="">Toutes les categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="pill-row">
            <button
              type="button"
              className={`filter-pill${!filters.category ? ' active' : ''}`}
              onClick={() => updateFilter('category', '')}
            >
              Tous
            </button>
            {categories.slice(0, 8).map((category) => (
              <button
                key={category.id}
                type="button"
                className={`filter-pill${filters.category === category.slug ? ' active' : ''}`}
                onClick={() => updateFilter('category', category.slug)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <section className="catalog-grid catalog-grid-fixed">
          {Array.from({ length: 6 }).map((_, index) => (
            <article className="product-card skeleton-card" key={`skeleton-${index}`}>
              <div className="product-thumb shimmer" />
              <div className="product-card-body">
                <div className="shimmer-line short" />
                <div className="shimmer-line" />
                <div className="shimmer-line medium" />
              </div>
            </article>
          ))}
        </section>
      ) : products.length === 0 ? (
        <section className="panel empty-state reveal-up">
          <h2>Aucun produit trouve</h2>
          <p className="hint">Essayez une autre categorie ou ajustez votre recherche.</p>
          <button className="button ghost" type="button" onClick={() => setSearchParams(new URLSearchParams())}>
            Reinitialiser les filtres
          </button>
        </section>
      ) : (
        <section className="catalog-grid catalog-grid-fixed">
          {products.map((product, index) => (
            <article className="product-card product-card-animated" key={product.id} style={{ animationDelay: `${index * 40}ms` }}>
              <div className="product-thumb">
                {product.images?.[0]?.url ? (
                  <img
                    src={product.images[0].url}
                    alt={product.images[0].alt_text || product.name}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span>Aucune image</span>
                )}
              </div>
              <div className="product-card-body">
                <div>
                  <strong>{product.name}</strong>
                  <p>{product.short_description || 'Produit disponible dans le catalogue.'}</p>
                </div>
                <div className="product-card-footer split">
                  <span>{formatPrice(product.price)} XOF</span>
                  <span className={`stock-badge ${product.stock_quantity > 0 ? 'in' : 'out'}`}>
                    {product.stock_quantity > 0 ? `${product.stock_quantity} en stock` : 'Rupture'}
                  </span>
                </div>
                <div className="table-actions">
                  <Link className="mini-button" to={`/products/${product.slug}`}>
                    Details
                  </Link>
                  <button
                    className="mini-button"
                    type="button"
                    disabled={pendingProductId === product.id || product.stock_quantity <= 0}
                    onClick={() => handleAddToCart(product.id)}
                  >
                    {pendingProductId === product.id ? 'Ajout...' : 'Ajouter'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      <div className="pagination-row panel reveal-up">
        <button className="mini-button" type="button" disabled={pagination.current_page <= 1} onClick={() => changePage(filters.page - 1)}>
          Precedent
        </button>
        <span>Page {pagination.current_page} / {pagination.last_page}</span>
        <button className="mini-button" type="button" disabled={pagination.current_page >= pagination.last_page} onClick={() => changePage(filters.page + 1)}>
          Suivant
        </button>
      </div>
    </div>
  )
}

export default CatalogPage
