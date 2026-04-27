import { createContext, useContext, useEffect, useState } from 'react'
import { useShopAuth } from './auth'
import { apiRequest } from './lib/api'

const SESSION_STORAGE_KEY = 'ets_shop_session_id'
const ShopContext = createContext(null)

function createSessionId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }

  return `ets-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function ShopProvider({ children }) {
  const { token } = useShopAuth()
  const [sessionId] = useState(() => {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY)

    if (existing) {
      return existing
    }

    const next = createSessionId()
    window.localStorage.setItem(SESSION_STORAGE_KEY, next)
    return next
  })
  const [cart, setCart] = useState(null)
  const [cartLoading, setCartLoading] = useState(true)
  const [cartError, setCartError] = useState('')

  useEffect(() => {
    hydrateCart(sessionId).catch(() => {
      // We keep the app visible even if cart hydration fails.
    })
  }, [sessionId, token])

  async function hydrateCart(currentSessionId = sessionId) {
    try {
      setCartLoading(true)
      const response = await apiRequest(`/cart?session_id=${encodeURIComponent(currentSessionId)}`, {}, token)
      setCart(response.data)
      setCartError('')
      return response.data
    } catch (error) {
      setCartError(error.message)
      return null
    } finally {
      setCartLoading(false)
    }
  }

  async function addToCart(productId, quantity = 1) {
    const response = await apiRequest('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, product_id: productId, quantity }),
    }, token)

    setCart(response.data)
    setCartError('')
    return response.data
  }

  async function updateCartItem(cartItemId, quantity) {
    const response = await apiRequest(`/cart/items/${cartItemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ session_id: sessionId, quantity }),
    }, token)

    setCart(response.data)
    setCartError('')
    return response.data
  }

  async function removeCartItem(cartItemId) {
    const response = await apiRequest(`/cart/items/${cartItemId}`, {
      method: 'DELETE',
      body: JSON.stringify({ session_id: sessionId }),
    }, token)

    setCart(response.data)
    setCartError('')
    return response.data
  }

  async function clearCart() {
    await apiRequest('/cart', {
      method: 'DELETE',
      body: JSON.stringify({ session_id: sessionId }),
    }, token)

    setCart(null)
    setCartError('')
  }

  return (
    <ShopContext.Provider
      value={{
        sessionId,
        cart,
        cartLoading,
        cartError,
        hydrateCart,
        addToCart,
        updateCartItem,
        removeCartItem,
        clearCart,
      }}
    >
      {children}
    </ShopContext.Provider>
  )
}

export function useShop() {
  const context = useContext(ShopContext)

  if (!context) {
    throw new Error('useShop must be used within ShopProvider')
  }

  return context
}
