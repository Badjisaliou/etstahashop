import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

function HomePage() {
  const { addToCart } = useShop()
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [categorySections, setCategorySections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cartMessage, setCartMessage] = useState('')
  const [pendingProductId, setPendingProductId] = useState(null)

  useEffect(() => {
    loadHome()
  }, [])

  async function loadHome() {
    try {
      setLoading(true)
      const [productsResponse, categoriesResponse] = await Promise.all([
        apiRequest('/products?featured=1&per_page=10'),
        apiRequest('/categories'),
      ])
      const loadedCategories = categoriesResponse.data ?? []
      const categoryResponses = await Promise.all(
        loadedCategories
          .filter((category) => Number(category.products_count ?? 0) > 0)
          .slice(0, 8)
          .map(async (category) => {
            const response = await apiRequest(`/products?category=${category.slug}&per_page=10`)
            return {
              category,
              products: response.data ?? [],
            }
          }),
      )

      setFeaturedProducts(productsResponse.data ?? [])
      setCategories(loadedCategories)
      setCategorySections(categoryResponses.filter((section) => section.products.length > 0))
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  const heroCategories = categories.slice(0, 10)
  const dealProducts = featuredProducts.slice(0, 6)

  async function handleAddToCart(productId) {
    try {
      setPendingProductId(productId)
      await addToCart(productId, 1)
      setCartMessage('Produit ajoute au panier.')
    } catch (addError) {
      setCartMessage(addError.message)
    } finally {
      setPendingProductId(null)
    }
  }

  function renderProductCard(product, index) {
    const badges = getProductBadges(product)
    const hasDiscount = getDiscountPercent(product) > 0
    const isOutOfStock = Number(product.stock_quantity ?? 0) <= 0

    return (
      <article className="product-card product-card-animated" key={product.id} style={{ animationDelay: `${index * 35}ms` }}>
        <div className="product-thumb">
          {badges.length > 0 ? (
            <div className="product-badges">
              {badges.map((badge) => (
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
            {hasDiscount ? <del>{formatPrice(product.compare_price)} XOF</del> : null}
          </div>
          <div className="product-card-actions">
            <Link className="mini-button" to={`/products/${product.slug}`}>
              Voir
            </Link>
            <button
              className="mini-button add-button"
              type="button"
              disabled={pendingProductId === product.id || isOutOfStock}
              onClick={() => handleAddToCart(product.id)}
            >
              {pendingProductId === product.id ? 'Ajout...' : isOutOfStock ? 'Rupture' : 'Ajouter'}
            </button>
          </div>
        </div>
      </article>
    )
  }

  function renderSkeletonRail(keyPrefix = 'home') {
    return (
      <div className="product-rail">
        {Array.from({ length: 6 }).map((_, index) => (
          <article className="product-card skeleton-card" key={`${keyPrefix}-${index}`}>
            <div className="product-thumb shimmer" />
            <div className="product-card-body">
              <div className="shimmer-line short" />
              <div className="shimmer-line" />
              <div className="shimmer-line medium" />
            </div>
          </article>
        ))}
      </div>
    )
  }

  return (
    <div className="market-home">
      <section className="market-hero reveal-up">
        <aside className="market-category-panel">
          <strong>Categories</strong>
          <div className="market-category-list">
            {heroCategories.length === 0 ? (
              <span className="muted-line">{loading ? 'Chargement...' : 'Aucune categorie'}</span>
            ) : (
              heroCategories.map((category) => (
                <Link key={category.id} to={`/catalogue?category=${category.slug}`}>
                  {category.name}
                </Link>
              ))
            )}
          </div>
        </aside>

        <div className="market-hero-banner">
          <p className="eyebrow">ETS Taha Shop</p>
          <h1 className="shop-title">Toutes vos bonnes affaires au meme endroit.</h1>
          <p className="shop-lead">
            Commandez vos produits en ligne, suivez votre panier et profitez d un service local a Dakar.
          </p>
          <div className="hero-actions">
            <Link className="button primary" to="/catalogue">
              Voir les offres
            </Link>
            <Link className="button ghost light" to="/track-order">
              Suivre ma commande
            </Link>
          </div>
        </div>

      </section>

      {error ? <p className="message error">{error}</p> : null}
      {cartMessage ? <p className={`message ${cartMessage.includes('ajoute') ? 'success' : 'error'}`}>{cartMessage}</p> : null}

      <section className="market-section deal-section reveal-up">
        <div className="market-section-heading">
          <h2>Ventes flash</h2>
          <Link to="/catalogue">Voir plus</Link>
        </div>
        {loading ? (
          renderSkeletonRail('deals')
        ) : dealProducts.length === 0 ? (
          <div className="empty-state">
            <p className="hint">Aucun produit vedette pour le moment.</p>
            <Link className="button ghost" to="/catalogue">
              Parcourir le catalogue
            </Link>
          </div>
        ) : (
          <div className="product-rail">
            {dealProducts.map((product, index) => renderProductCard(product, index))}
          </div>
        )}
      </section>

      <section className="market-section reveal-up">
        <div className="market-section-heading">
          <h2>Categories populaires</h2>
          <Link to="/catalogue">Tout parcourir</Link>
        </div>
        <div className="category-strip">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <span className="category-chip skeleton-card" key={`category-skeleton-${index}`}>
                <span className="shimmer-line medium" />
                <span className="shimmer-line short" />
              </span>
            ))
          ) : (
            categories.map((category) => (
              <Link key={category.id} className="category-chip" to={`/catalogue?category=${category.slug}`}>
                <strong>{category.name}</strong>
                <span>{category.products_count} produits</span>
              </Link>
            ))
          )}
        </div>
      </section>

      {categorySections.map((section) => (
        <section className="market-section reveal-up" key={section.category.id}>
          <div className="market-section-heading">
            <h2>{section.category.name}</h2>
            <Link to={`/catalogue?category=${section.category.slug}`}>Voir tout</Link>
          </div>
          <div className="product-rail">
            {section.products.map((product, index) => renderProductCard(product, index))}
          </div>
        </section>
      ))}

    </div>
  )
}

export default HomePage
