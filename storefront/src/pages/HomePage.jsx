import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../lib/api'

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR').format(Number(value ?? 0))
}

function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadHome()
  }, [])

  async function loadHome() {
    try {
      setLoading(true)
      const [productsResponse, categoriesResponse] = await Promise.all([
        apiRequest('/products?featured=1'),
        apiRequest('/categories'),
      ])

      setFeaturedProducts(productsResponse.data ?? [])
      setCategories(categoriesResponse.data ?? [])
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  const heroCategories = categories.slice(0, 10)
  const dealProducts = featuredProducts.slice(0, 6)

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

      <section className="market-section deal-section reveal-up">
        <div className="market-section-heading">
          <h2>Ventes flash</h2>
          <Link to="/catalogue">Voir plus</Link>
        </div>
        {dealProducts.length === 0 ? (
          <div className="empty-state">
            <p className="hint">Aucun produit vedette pour le moment.</p>
            <Link className="button ghost" to="/catalogue">
              Parcourir le catalogue
            </Link>
          </div>
        ) : (
          <div className="catalog-grid catalog-grid-fixed">
            {dealProducts.map((product, index) => (
              <article className="product-card product-card-animated" key={product.id} style={{ animationDelay: `${index * 70}ms` }}>
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
                  <span className="deal-badge">Offre</span>
                  <strong>{product.name}</strong>
                  <p>{product.short_description || 'Produit disponible dans le catalogue.'}</p>
                  <div className="product-card-footer">
                    <span>{formatPrice(product.price)} XOF</span>
                    <Link className="mini-button" to={`/products/${product.slug}`}>
                      Voir le produit
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="market-section reveal-up">
        <div className="market-section-heading">
          <h2>Categories populaires</h2>
          <Link to="/catalogue">Tout parcourir</Link>
        </div>
        <div className="category-strip">
          {categories.map((category) => (
            <Link key={category.id} className="category-chip" to={`/catalogue?category=${category.slug}`}>
              <strong>{category.name}</strong>
              <span>{category.products_count} produits</span>
            </Link>
          ))}
        </div>
      </section>

    </div>
  )
}

export default HomePage
