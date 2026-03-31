import { useEffect } from 'react'
import { apiRequest } from '../lib/api'

const LAST_SEEN_ORDER_ID_KEY = 'ets_admin_last_seen_order_id'
const POLL_INTERVAL_MS = 20000

function toOrderId(order) {
  const value = Number(order?.id)
  return Number.isFinite(value) ? value : 0
}

function sendDesktopNotification(order) {
  if (!window.desktop?.notify) {
    return
  }

  window.desktop.notify({
    title: 'Nouvelle commande recue',
    body: `${order.order_number ?? `Commande #${order.id}`} - ${order.total_amount ?? ''} ${order.currency ?? ''}`.trim(),
  })
}

export function useOrderNotifications({ token, enabled }) {
  useEffect(() => {
    if (!enabled || !token || !window.desktop?.notify) {
      return
    }

    let cancelled = false

    async function checkForNewOrders() {
      try {
        const response = await apiRequest('/orders?per_page=5&page=1', {}, token)
        const orders = response?.data ?? []
        if (!orders.length || cancelled) {
          return
        }

        const latestOrderId = Math.max(...orders.map((order) => toOrderId(order)))
        const storedLastSeen = Number(window.localStorage.getItem(LAST_SEEN_ORDER_ID_KEY) ?? 0)

        if (!storedLastSeen) {
          window.localStorage.setItem(LAST_SEEN_ORDER_ID_KEY, String(latestOrderId))
          return
        }

        if (latestOrderId <= storedLastSeen) {
          return
        }

        const newOrders = orders
          .filter((order) => toOrderId(order) > storedLastSeen)
          .sort((a, b) => toOrderId(a) - toOrderId(b))

        if (newOrders.length === 1) {
          sendDesktopNotification(newOrders[0])
        } else if (newOrders.length > 1) {
          sendDesktopNotification({
            id: latestOrderId,
            order_number: `${newOrders.length} nouvelles commandes`,
            total_amount: '',
            currency: '',
          })
        }

        window.localStorage.setItem(LAST_SEEN_ORDER_ID_KEY, String(latestOrderId))
      } catch {
        // Keep the polling resilient, errors are already surfaced in the app when needed.
      }
    }

    checkForNewOrders()
    const intervalId = window.setInterval(checkForNewOrders, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [enabled, token])
}
