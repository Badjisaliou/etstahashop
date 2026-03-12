import { createContext, useContext, useEffect, useState } from 'react'
import { apiRequest } from './lib/api'

const TOKEN_STORAGE_KEY = 'ets_admin_token'
const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? '')
  const [admin, setAdmin] = useState(null)
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
      const response = await apiRequest('/me', {}, currentToken)
      setAdmin(response.data)
      setAuthError('')
    } catch (error) {
      setAuthError(error.message)
      logout(false)
    } finally {
      setLoadingSession(false)
    }
  }

  async function login(credentials) {
    const response = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    const nextToken = response.data.token
    window.localStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
    setToken(nextToken)
    setAdmin(response.data.user)
    setAuthError('')

    return response.data.user
  }

  async function logout(callApi = true) {
    if (callApi && token) {
      try {
        await apiRequest('/logout', { method: 'POST' }, token)
      } catch {
        // Local logout fallback is enough.
      }
    }

    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken('')
    setAdmin(null)
  }

  return (
    <AdminAuthContext.Provider
      value={{
        token,
        admin,
        loadingSession,
        authError,
        setAuthError,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)

  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }

  return context
}

