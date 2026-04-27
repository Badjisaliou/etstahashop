export function safeStorageGet(key, fallback = '') {
  try {
    return window.localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

export function safeStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function safeStorageRemove(key) {
  try {
    window.localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

