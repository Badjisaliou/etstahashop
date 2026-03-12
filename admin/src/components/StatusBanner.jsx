function StatusBanner({ message, tone = 'info' }) {
  if (!message) {
    return null
  }

  return (
    <p className={`message ${tone}`} role="status" aria-live="polite">
      {message}
    </p>
  )
}

export default StatusBanner

