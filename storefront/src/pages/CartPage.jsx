import { Link, useNavigate } from 'react-router-dom'
import { useShop } from '../shop'

function CartPage() {
  const navigate = useNavigate()
  const { cart, cartLoading, removeCartItem, updateCartItem, clearCart } = useShop()

  async function handleQuantityChange(itemId, quantity) {
    if (quantity < 1) {
      return
    }

    await updateCartItem(itemId, quantity)
  }

  if (cartLoading) {
    return <section className="panel"><p>Chargement du panier...</p></section>
  }

  return (
    <div className="shop-stack">
      <section className="panel">
        <div className="section-heading">
          <h2>Panier</h2>
          <p>{cart ? `${cart.items_count} articles dans votre panier.` : 'Votre panier est vide.'}</p>
        </div>
        {!cart ? (
          <div className="empty-state">
            <p>Ajoute quelques produits pour commencer une commande.</p>
            <Link className="button primary" to="/catalogue">
              Retour au catalogue
            </Link>
          </div>
        ) : (
          <div className="cart-list">
            {cart.items.map((item) => (
              <article className="cart-row" key={item.id}>
                <div className="cart-row-main">
                  <strong>{item.product?.name ?? 'Produit'}</strong>
                  <p>{item.product?.short_description || item.product?.description || 'Article du panier.'}</p>
                  <span className="muted-line">{item.unit_price} XOF unite</span>
                </div>
                <div className="cart-row-side">
                  <input type="number" min="1" value={item.quantity} onChange={(event) => handleQuantityChange(item.id, Number(event.target.value) || 1)} />
                  <strong>{item.line_total} XOF</strong>
                  <button className="mini-button danger" type="button" onClick={() => removeCartItem(item.id)}>
                    Retirer
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {cart ? (
        <section className="panel cart-summary">
          <div>
            <strong>Sous-total</strong>
            <p>{cart.subtotal_amount} XOF</p>
          </div>
          <div className="table-actions">
            <button className="button ghost" type="button" onClick={() => clearCart()}>
              Vider le panier
            </button>
            <button className="button primary" type="button" onClick={() => navigate('/checkout')}>
              Passer la commande
            </button>
          </div>
        </section>
      ) : null}
    </div>
  )
}

export default CartPage
