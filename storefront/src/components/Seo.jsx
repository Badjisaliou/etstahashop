import { useLocation } from 'react-router-dom'

const origin = (import.meta.env.VITE_SITE_URL || 'https://etstahashop.com').replace(/\/$/, '')
const description = 'Découvrez le catalogue ETS Taha Shop : produits, prix en XOF, disponibilité et commande en ligne. Contactez notre équipe pour vous accompagner.'

export default function Seo({ product, category, unavailable = false }) {
  const { pathname, search } = useLocation()
  const isProduct = pathname.startsWith('/products/')
  const isPublic = pathname === '/' || pathname === '/catalogue' || isProduct
  const params = new URLSearchParams(search)
  const filtered = [...params.keys()].some(key => key !== 'category')
  const noindex = !isPublic || unavailable || (pathname === '/catalogue' && filtered)
  const title = product ? `${product.name} | ETS Taha Shop` : category ? `${category.name} : catalogue et prix | ETS Taha Shop` : pathname === '/catalogue' ? 'Catalogue et prix | ETS Taha Shop' : isPublic ? 'ETS Taha Shop | Boutique en ligne' : 'Espace client | ETS Taha Shop'
  const summary = product ? String(product.short_description || product.description || description).replace(/<[^>]*>/g, '').slice(0, 170) : category ? `Découvrez les produits de la catégorie ${category.name} chez ETS Taha Shop : prix en XOF, disponibilité et commande en ligne.` : description
  const categorySlug = category?.slug || params.get('category')
  const url = `${origin}${pathname}${pathname === '/catalogue' && categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : ''}`
  const image = product?.images?.[0]?.url
  const structured = product ? {
    '@context': 'https://schema.org', '@type': 'Product', name: product.name,
    description: summary, ...(image ? { image: [image] } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    offers: { '@type': 'Offer', url, priceCurrency: 'XOF', price: String(product.price),
      availability: Number(product.stock_quantity) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
  } : null

  return <>
    <title>{title}</title>
    <meta name="description" content={summary} />
    <meta name="robots" content={noindex ? 'noindex,follow' : 'index,follow'} />
    <link rel="canonical" href={url} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={summary} />
    <meta property="og:url" content={url} />
    <meta property="og:type" content={product ? 'product' : 'website'} />
    <meta property="og:locale" content="fr_FR" />
    {image ? <meta property="og:image" content={image} /> : null}
    {structured ? <script type="application/ld+json">{JSON.stringify(structured).replace(/</g, '\\u003c')}</script> : null}
  </>
}
