import { createContext, useContext, useEffect, useState } from 'react'
import { apiRequest } from './lib/api'
import { safeStorageGet, safeStorageRemove, safeStorageSet } from './lib/safeStorage'

const TOKEN_STORAGE_KEY = 'ets_shop_token'
const ShopAuthContext = createContext(null)

export function ShopAuthProvider({ children }) {
  const [token, setToken] = useState(() => safeStorageGet(TOKEN_STORAGE_KEY, ''))
  const [customer, setCustomer] = useState(null)
  const [loadingSession, setLoadingSession] = useState(Boolean(token))
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (!token) {
      setLoadingSession(false)
      return
    }

    hydrateSession(token)
  }, [])

  async function hydrateSession(currentToken) {
    try {
      setLoadingSession(true)
      const response = await apiRequest('/auth/me', {}, currentToken)
      setCustomer(response.data)
      setAuthError('')
    } catch (error) {
      setAuthError(error.message)
      logout(false)
    } finally {
      setLoadingSession(false)
    }
  }

  async function login(credentials) {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    persistSession(response.data)
    return response.data.user
  }

  async function register(payload) {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    persistSession(response.data)
    return response.data.user
  }

  async function loadOrders(page = 1, perPage = 10) {
    return apiRequest(`/auth/orders?page=${page}&per_page=${perPage}`, {}, token)
  }

  async function logout(callApi = true) {
    if (callApi && token) {
      try {
        await apiRequest('/auth/logout', { method: 'POST' }, token)
      } catch {
        // Local logout fallback is enough.
      }
    }

    safeStorageRemove(TOKEN_STORAGE_KEY)
    setToken('')
    setCustomer(null)
  }

  function persistSession(data) {
    safeStorageSet(TOKEN_STORAGE_KEY, data.token)
    setToken(data.token)
    setCustomer(data.user)
    setAuthError('')
  }

  return (
    <ShopAuthContext.Provider
      value={{
        token,
        customer,
        loadingSession,
        authError,
        setAuthError,
        login,
        register,
        logout,
        loadOrders,
      }}
    >
      {children}
    </ShopAuthContext.Provider>
  )
}

export function useShopAuth() {
  const context = useContext(ShopAuthContext)

  if (!context) {
    throw new Error('useShopAuth must be used within ShopAuthProvider')
  }

  return context
}
