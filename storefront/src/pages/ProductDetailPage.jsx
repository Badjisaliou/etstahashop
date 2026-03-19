import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiRequest } from '../lib/api'
import { useShop } from '../shop'

function ProductDetailPage() {
  const { slug } = useParams()
  const { addToCart } = useShop()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadProduct()
  }, [slug])

  async function loadProduct() {
    try {
      setLoading(true)
      const response = await apiRequest(`/products/${slug}`)
      setProduct(response.data)
      setMessage('')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddToCart() {
    if (!product) {
      return
    }

    try {
      setAdding(true)
      await addToCart(product.id, quantity)
      setMessage('Produit ajoute au panier avec succes.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return <section className="panel"><p>Chargement du produit...</p></section>
  }

  if (!product) {
    return <section className="panel"><p>{message || 'Produit introuvable.'}</p></section>
  }

  return (
    <section className="product-detail-layout">
      <article className="panel">
        <div className="product-detail-image">
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
      </article>

      <article className="panel product-detail-copy">
        <p className="eyebrow">{product.category?.name ?? 'Catalogue'}</p>
        <h2>{product.name}</h2>
        <p className="shop-lead">{product.short_description || product.description || 'Produit disponible dans la boutique.'}</p>
        <p>{product.description}</p>
        <div className="detail-meta">
          <strong>{product.price} XOF</strong>
          <span>Stock disponible: {product.stock_quantity}</span>
          <span>SKU: {product.sku}</span>
        </div>
        {message ? <p className={`message ${message.includes('succes') ? 'success' : 'error'}`}>{message}</p> : null}
        <div className="filter-row">
          <input type="number" min="1" max={product.stock_quantity || 1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value) || 1)} />
          <button className="button primary" type="button" disabled={adding || product.stock_quantity <= 0} onClick={handleAddToCart}>
            {adding ? 'Ajout...' : product.stock_quantity > 0 ? 'Ajouter au panier' : 'Rupture de stock'}
          </button>
          <Link className="button ghost" to="/cart">
            Voir le panier
          </Link>
        </div>
      </article>
    </section>
  )
}

export default ProductDetailPage
