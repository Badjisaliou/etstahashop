import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../lib/api'
import { useShop } from '../shop'

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR').format(Number(value ?? 0))
}

function getDiscountPercent(product) {
  const price = Number(product.price ?? 0)
  const comparePrice = Number(product.compare_price ?? 0)

  if (!comparePrice || comparePrice <= price || !price) {
    return 0
  }

  return Math.round(((comparePrice - price) / comparePrice) * 100)
}

function getProductBadges(product) {
  const badges = []
  const discount = getDiscountPercent(product)

  if (discount > 0) {
    badges.push(`-${discount}%`)
  }

  if (product.is_featured) {
    badges.push('Offre')
  }

  if (Number(product.stock_quantity ?? 0) <= 0) {
    badges.push('Rupture')
  } else if (Number(product.stock_quantity ?? 0) <= 3) {
    badges.push('Stock limite')
  }

  return badges.slice(0, 2)
}

function CatalogPage() {
  const productsPerPage = 24
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
      sort: searchParams.get('sort') ?? 'latest',
      inStock: searchParams.get('in_stock') === '1',
      page: Number(searchParams.get('page') ?? '1'),
    }),
    [searchParams],
  )
  const isCategoryIndex = !filters.category && !filters.search.trim()
  const selectedCategory = categories.find((category) => category.slug === filters.category)

  useEffect(() => {
    loadCatalog()
  }, [filters.search, filters.category, filters.sort, filters.inStock, filters.page])

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      const response = await apiRequest('/categories')
      setCategories(response.data ?? [])
    } catch (error) {
      setMessage(error.message)
      setCategories([])
    }
  }

  async function loadCatalog() {
    if (isCategoryIndex) {
      setProducts([])
      setPagination({ current_page: 1, last_page: 1, total: 0 })
      setMessage('')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(filters.page), per_page: String(productsPerPage) })

      if (filters.search.trim()) {
        params.set('search', filters.search.trim())
      }

      if (filters.category) {
        params.set('category', filters.category)
      }

      if (filters.sort && filters.sort !== 'latest') {
        params.set('sort', filters.sort)
      }

      if (filters.inStock) {
        params.set('in_stock', '1')
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

  function toggleInStock() {
    const next = new URLSearchParams(searchParams)

    if (filters.inStock) {
      next.delete('in_stock')
    } else {
      next.set('in_stock', '1')
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

  if (isCategoryIndex) {
    return (
      <div className="categories-page">
        <section className="market-section reveal-up">
          <div className="market-section-heading">
            <h2>Categories</h2>
            <span>{categories.length} categories disponibles</span>
          </div>
          {message ? <p className="message error">{message}</p> : null}
          <div className="category-directory">
            {categories.map((category) => (
              <Link key={category.id} className="category-card-large" to={`/catalogue?category=${category.slug}`}>
                <strong>{category.name}</strong>
                <span>{category.products_count} produits</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="catalog-market-layout">
      <aside className="catalog-sidebar reveal-up">
        <div className="sidebar-block">
          <strong>Categories</strong>
          <button
            type="button"
            className={`sidebar-filter${!filters.category ? ' active' : ''}`}
            onClick={() => updateFilter('category', '')}
          >
            Toutes les categories
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`sidebar-filter${filters.category === category.slug ? ' active' : ''}`}
              onClick={() => updateFilter('category', category.slug)}
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="sidebar-block">
          <strong>Service</strong>
          <span>Livraison suivie</span>
          <span>Paiement confirme manuellement</span>
          <span>Support local</span>
        </div>
      </aside>

      <section className="catalog-results">
        <section className="market-section reveal-up">
          <div className="catalog-toolbar">
            <div>
              <h2>{selectedCategory?.name ?? 'Catalogue'}</h2>
              <p>{loading ? 'Chargement...' : `${pagination.total} produits trouves.`}</p>
            </div>
            <div className="catalog-search-row">
              <input
                value={filters.search}
                onChange={(event) => updateFilter('search', event.target.value)}
                placeholder="Rechercher dans le catalogue"
              />
              <select value={filters.category} onChange={(event) => updateFilter('category', event.target.value)}>
                <option value="">Toutes les categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)}>
                <option value="latest">Plus recents</option>
                <option value="featured">Produits vedettes</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix decroissant</option>
              </select>
              <button
                className={`filter-pill stock-toggle${filters.inStock ? ' active' : ''}`}
                type="button"
                onClick={toggleInStock}
              >
                En stock
              </button>
            </div>
          </div>
          {message ? <p className={`message ${message.includes('succes') ? 'success' : 'error'}`}>{message}</p> : null}
        </section>

        {loading ? (
          <section className="market-section catalog-grid catalog-grid-fixed">
            {Array.from({ length: 12 }).map((_, index) => (
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
          <section className="market-section empty-state reveal-up">
            <h2>Aucun produit trouve</h2>
            <p className="hint">Essayez une autre categorie ou ajustez votre recherche.</p>
            <button className="button ghost" type="button" onClick={() => setSearchParams(new URLSearchParams())}>
              Reinitialiser les filtres
            </button>
          </section>
        ) : (
          <section className="market-section catalog-grid catalog-grid-fixed">
            {products.map((product, index) => (
              <article className="product-card product-card-animated" key={product.id} style={{ animationDelay: `${index * 40}ms` }}>
                <div className="product-thumb">
                  {getProductBadges(product).length > 0 ? (
                    <div className="product-badges">
                      {getProductBadges(product).map((badge) => (
                        <span key={badge} className={badge === 'Rupture' ? 'danger' : ''}>{badge}</span>
                      ))}
                    </div>
                  ) : null}
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
                  <strong>{product.name}</strong>
                  <p>{product.short_description || 'Produit disponible dans le catalogue.'}</p>
                  <div className="product-price-stack">
                    <span>{formatPrice(product.price)} XOF</span>
                    {getDiscountPercent(product) > 0 ? <del>{formatPrice(product.compare_price)} XOF</del> : null}
                  </div>
                  <div className="product-card-footer split">
                    <span className={`stock-badge ${product.stock_quantity > 0 ? 'in' : 'out'}`}>
                      {product.stock_quantity > 0 ? 'En stock' : 'Rupture'}
                    </span>
                  </div>
                  <div className="product-card-actions">
                    <Link className="mini-button" to={`/products/${product.slug}`}>
                      Details
                    </Link>
                    <button
                      className="mini-button add-button"
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

        <div className="pagination-row market-section reveal-up">
          <button className="mini-button" type="button" disabled={pagination.current_page <= 1} onClick={() => changePage(filters.page - 1)}>
            Precedent
          </button>
          <span>Page {pagination.current_page} / {pagination.last_page}</span>
          <button className="mini-button" type="button" disabled={pagination.current_page >= pagination.last_page} onClick={() => changePage(filters.page + 1)}>
            Suivant
          </button>
        </div>
      </section>
    </div>
  )
}

export default CatalogPage
