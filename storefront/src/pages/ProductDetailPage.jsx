import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../lib/api'
import { useShop } from '../shop'

const SHOP_CONTACT_PHONE = import.meta.env.VITE_SHOP_CONTACT_PHONE ?? '+221 76 990 94 66'

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

  return badges
}

function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
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

  const discount = getDiscountPercent(product)
  const badges = getProductBadges(product)
  const cleanPhone = SHOP_CONTACT_PHONE.replace(/\D/g, '')
  const whatsappMessage = encodeURIComponent(
    `Bonjour ETS TAHA SHOP, je souhaite avoir des informations sur ce produit: ${product.name}`
  )
  const whatsappLink = `https://wa.me/${cleanPhone}?text=${whatsappMessage}`

  return (
    <div className="product-market-page">
      <button className="mini-button back-link" type="button" onClick={() => navigate(-1)}>
        Retour
      </button>

      <section className="product-market-layout">
        <article className="product-gallery-panel">
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

        <article className="product-main-panel">
          <p className="product-category-label">{product.category?.name ?? 'Catalogue'}</p>
          {badges.length > 0 ? (
            <div className="detail-badge-row">
              {badges.map((badge) => (
                <span key={badge} className={badge === 'Rupture' ? 'danger' : ''}>{badge}</span>
              ))}
            </div>
          ) : null}
          <h2>{product.name}</h2>
          <p className="product-summary">{product.short_description || 'Produit disponible dans la boutique.'}</p>
          <div className="product-price-block">
            <div className="detail-price-stack">
              <strong>{formatPrice(product.price)} XOF</strong>
              {discount > 0 ? <del>{formatPrice(product.compare_price)} XOF</del> : null}
            </div>
            <span className={`stock-badge ${product.stock_quantity > 0 ? 'in' : 'out'}`}>
              {product.stock_quantity > 0 ? `${product.stock_quantity} en stock` : 'Rupture de stock'}
            </span>
          </div>
          <div className="product-description-block">
            <h3>Description</h3>
            <p>{product.description || product.short_description || 'Plus de details seront disponibles prochainement.'}</p>
          </div>
          <div className="detail-meta">
            <span>SKU: {product.sku || 'Non renseigne'}</span>
          </div>
          {message ? <p className={`message ${message.includes('succes') ? 'success' : 'error'}`}>{message}</p> : null}
        </article>

        <aside className="buy-box">
          <strong>Commander ce produit</strong>
          <label>
            <span>Quantite</span>
            <input type="number" min="1" max={product.stock_quantity || 1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value) || 1)} />
          </label>
          <button className="button primary" type="button" disabled={adding || product.stock_quantity <= 0} onClick={handleAddToCart}>
            {adding ? 'Ajout...' : product.stock_quantity > 0 ? 'Ajouter au panier' : 'Rupture de stock'}
          </button>
          <Link className="button ghost" to="/cart">
            Voir le panier
          </Link>
          <a className="button whatsapp-button" href={whatsappLink} target="_blank" rel="noopener noreferrer">
            Demander sur WhatsApp
          </a>
          <div className="buy-box-services">
            <span>Livraison suivie</span>
            <span>Paiement confirme manuellement</span>
            <span>Support local WhatsApp</span>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default ProductDetailPage

