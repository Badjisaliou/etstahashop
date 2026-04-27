import React from 'react'

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Storefront runtime error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="shop-shell">
          <section className="panel">
            <h2>Une erreur est survenue</h2>
            <p>Rechargez la page. Si le probleme persiste, verifiez la connexion internet puis reessayez.</p>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

export default AppErrorBoundary

