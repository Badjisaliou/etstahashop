import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../lib/api'

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
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Boutique en ligne</p>
          <h1 className="shop-title">Les produits ETS Taha Shop, sur le web et bientot sur mobile.</h1>
          <p className="shop-lead">
            Catalogue, panier et commande sont maintenant relies au backend Laravel deja en place.
          </p>
          <div className="hero-actions">
            <Link className="button primary" to="/catalogue">
              Voir le catalogue
            </Link>
            <Link className="button ghost" to="/cart">
              Ouvrir le panier
            </Link>
          </div>
        </div>
      </section>

      {error ? <p className="message error">{error}</p> : null}

      <section className="panel">
        <div className="section-heading">
          <h2>Categories</h2>
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

      <section className="panel">
        <div className="section-heading">
          <h2>Produits en vedette</h2>
          <p>{loading ? 'Chargement...' : `${featuredProducts.length} produits mis en avant.`}</p>
        </div>
        <div className="catalog-grid">
          {featuredProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-thumb">
                {product.images?.[0]?.url ? <img src={product.images[0].url} alt={product.images[0].alt_text || product.name} /> : <span>Aucune image</span>}
              </div>
              <div className="product-card-body">
                <strong>{product.name}</strong>
                <p>{product.short_description || 'Produit disponible dans le catalogue.'}</p>
                <div className="product-card-footer">
                  <span>{product.price} XOF</span>
                  <Link className="mini-button" to={`/products/${product.slug}`}>
                    Voir le produit
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage
