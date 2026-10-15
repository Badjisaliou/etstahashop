// Run during Vite builds so robots and sitemap use the deployed canonical domain.
export function seoAssets(env) {
  const origin = new URL(env.VITE_SITE_URL || 'https://etstahashop.com').origin
  const escapeXml = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
  return {
    name: 'seo-assets',
    async generateBundle() {
      const paths = ['/', '/catalogue']
      if (env.VITE_API_URL) {
        try {
          let page = 1
          let lastPage = 1
          do {
            const response = await fetch(`${env.VITE_API_URL.replace(/\/$/, '')}/products?per_page=60&page=${page}`, { signal: AbortSignal.timeout(10000) })
            if (!response.ok) throw new Error(`API HTTP ${response.status}`)
            const payload = await response.json()
            if (!Array.isArray(payload.data)) throw new Error('Invalid catalogue response')
            for (const product of payload.data) paths.push(`/products/${encodeURIComponent(product.slug)}`)
            lastPage = Number(payload.last_page || 1)
            page += 1
          } while (page <= lastPage)
        } catch (error) {
          this.error(`Impossible de générer le sitemap produits : ${error.message}. Vérifier VITE_API_URL et reconstruire.`)
        }
      } else {
        this.warn('VITE_API_URL absent : sitemap limité à accueil et catalogue.')
      }
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n` })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...new Set(paths)].map(path => `<url><loc>${escapeXml(origin + path)}</loc></url>`).join('')}</urlset>` })
    },
  }
}
