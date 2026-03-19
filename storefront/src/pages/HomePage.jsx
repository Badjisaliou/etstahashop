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

  return (
    <div className="shop-stack">
      <section className="hero-panel hero-grid reveal-up">
        <div>
          <p className="eyebrow">Etablissement Taha</p>
          <h1 className="shop-title">Votre boutique digitale, fiable, rapide et claire.</h1>
          <p className="shop-lead">
            Explorez les categories, ajoutez vos produits au panier et finalisez votre commande en quelques clics.
          </p>
          <div className="hero-actions">
            <Link className="button primary" to="/catalogue">
              Explorer les produits
            </Link>
            <Link className="button ghost" to="/track-order">
              Suivre une commande
            </Link>
          </div>
          <div className="trust-strip">
            <span className="trust-pill">Paiement confirme manuellement</span>
            <span className="trust-pill">Support local</span>
            <span className="trust-pill">Livraison suivie</span>
          </div>
        </div>
        <div className="hero-insights">
          <article className="metric-card">
            <p>Categories actives</p>
            <strong>{categories.length}</strong>
          </article>
          <article className="metric-card">
            <p>Produits en vedette</p>
            <strong>{featuredProducts.length}</strong>
          </article>
          <article className="metric-card">
            <p>Positionnement</p>
            <strong>E-commerce local</strong>
          </article>
        </div>
      </section>

      {error ? <p className="message error">{error}</p> : null}

      <section className="panel reveal-up">
        <div className="section-heading">
          <h2>Parcourir par categorie</h2>
          <p>{loading ? 'Chargement...' : `${categories.length} categories disponibles.`}</p>
        </div>
        <div className="chip-grid">
          {categories.map((category) => (
            <Link key={category.id} className="category-chip" to={`/catalogue?category=${category.slug}`}>
              <strong>{category.name}</strong>
              <span>{category.products_count} produits</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel reveal-up">
        <div className="section-heading">
          <h2>Selection de la semaine</h2>
          <p>{loading ? 'Chargement...' : `${featuredProducts.length} produits mis en avant.`}</p>
        </div>
        <div className="catalog-grid">
          {featuredProducts.map((product, index) => (
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
      </section>

      <section className="panel cta-band reveal-up">
        <div>
          <p className="eyebrow">Besoin d aide</p>
          <h2>Un produit en tete ? Passez commande facilement.</h2>
          <p className="hint">Accedez au panier ou suivez directement votre commande existante.</p>
        </div>
        <div className="hero-actions">
          <Link className="button primary" to="/cart">
            Ouvrir le panier
          </Link>
          <Link className="button ghost" to="/track-order">
            Suivre ma commande
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage
