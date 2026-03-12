import { useEffect, useMemo, useState } from 'react'
import StatusBanner from '../components/StatusBanner'
import { useAdminAuth } from '../auth'
import { API_BASE_URL, apiRequest } from '../lib/api'

const emptyForm = {
  category_id: '',
  name: '',
  slug: '',
  sku: '',
  short_description: '',
  description: '',
  price: '',
  compare_price: '',
  stock_quantity: '',
  is_active: true,
  is_featured: false,
  image_path: '',
}

const initialFilters = {
  search: '',
  status: 'all',
  featured: 'all',
  categoryId: '',
  perPage: 10,
  page: 1,
}

function ProductsPage() {
  const { token } = useAdminAuth()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [filters, setFilters] = useState(initialFilters)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [feedback, setFeedback] = useState({ text: '', tone: 'info' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.parent_id ? `${category.name} (sous-categorie)` : category.name })),
    [categories],
  )

  const productValidationError = useMemo(() => {
    if (!form.category_id) {
      return 'La categorie est requise.'
    }

    if (!form.name.trim()) {
      return 'Le nom du produit est requis.'
    }

    if (!form.sku.trim()) {
      return 'Le SKU est requis.'
    }

    if (form.price === '' || Number(form.price) < 0) {
      return 'Le prix doit etre renseigne et positif.'
    }

    if (form.compare_price !== '' && Number(form.compare_price) < Number(form.price)) {
      return 'Le prix compare doit etre superieur ou egal au prix.'
    }

    return ''
  }, [form.category_id, form.compare_price, form.name, form.price, form.sku])

  useEffect(() => {
    loadProducts()
  }, [filters.page, filters.perPage, filters.status, filters.featured, filters.categoryId])

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      const response = await apiRequest('/categories?per_page=50', {}, token)
      setCategories(response.data ?? [])
    } catch (error) {
      setFeedback({ text: error.message, tone: 'error' })
    }
  }

  async function loadProducts(customFilters = filters) {
    try {
      setLoading(true)

      const searchParams = new URLSearchParams({
        page: String(customFilters.page),
        per_page: String(customFilters.perPage),
      })

      if (customFilters.search.trim()) {
        searchParams.set('search', customFilters.search.trim())
      }

      if (customFilters.status !== 'all') {
        searchParams.set('status', customFilters.status)
      }

      if (customFilters.featured === 'featured') {
        searchParams.set('featured', '1')
      }

      if (customFilters.categoryId) {
        searchParams.set('category_id', customFilters.categoryId)
      }

      const response = await apiRequest(`/products?${searchParams.toString()}`, {}, token)
      setProducts(response.data ?? [])
      setPagination({
        current_page: response.current_page ?? 1,
        last_page: response.last_page ?? 1,
        total: response.total ?? 0,
      })
      setFeedback({ text: '', tone: 'info' })
    } catch (error) {
      setFeedback({ text: error.message, tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  function startEdit(product) {
    setEditingId(product.id)
    const existingImage = product.images?.[0] ?? null
    const existingPath = existingImage?.path ?? ''

    setForm({
      category_id: product.category_id ? String(product.category_id) : '',
      name: product.name,
      slug: product.slug ?? '',
      sku: product.sku,
      short_description: product.short_description ?? '',
      description: product.description ?? '',
      price: product.price ?? '',
      compare_price: product.compare_price ?? '',
      stock_quantity: product.stock_quantity ?? '',
      is_active: Boolean(product.is_active),
      is_featured: Boolean(product.is_featured),
      image_path: existingPath,
    })
    setImagePreviewUrl(existingImage?.url ?? (existingPath ? `${API_BASE_URL.replace('/api', '')}/storage/${existingPath}` : ''))
    setFeedback({ text: 'Edition de produit activee.', tone: 'info' })
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
    setImagePreviewUrl('')
  }

  function handleSearchSubmit(event) {
    event.preventDefault()
    const nextFilters = { ...filters, page: 1 }
    setFilters(nextFilters)
    loadProducts(nextFilters)
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const formData = new FormData()
    formData.append('image', file)

    try {
      setUploadingImage(true)
      const response = await fetch(`${API_BASE_URL}/uploads/products/images`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.message ?? 'Echec du televersement de l image.')
      }

      setForm((current) => ({ ...current, image_path: payload.data.path }))
      setImagePreviewUrl(payload.data.url)
      setFeedback({ text: 'Image televersee avec succes.', tone: 'success' })
    } catch (error) {
      setFeedback({ text: error.message, tone: 'error' })
    } finally {
      setUploadingImage(false)
      event.target.value = ''
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (productValidationError) {
      setFeedback({ text: productValidationError, tone: 'error' })
      return
    }

    setSaving(true)

    const payload = {
      category_id: form.category_id ? Number(form.category_id) : null,
      name: form.name,
      slug: form.slug || undefined,
      sku: form.sku,
      short_description: form.short_description || undefined,
      description: form.description || undefined,
      price: Number(form.price),
      compare_price: form.compare_price ? Number(form.compare_price) : null,
      stock_quantity: form.stock_quantity ? Number(form.stock_quantity) : 0,
      is_active: form.is_active,
      is_featured: form.is_featured,
      images: form.image_path
        ? [
            {
              path: form.image_path,
              alt_text: form.name,
              position: 0,
              is_primary: true,
            },
          ]
        : [],
    }

    try {
      if (editingId) {
        await apiRequest(`/products/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) }, token)
        setFeedback({ text: 'Produit modifie avec succes.', tone: 'success' })
      } else {
        await apiRequest('/products', { method: 'POST', body: JSON.stringify(payload) }, token)
        setFeedback({ text: 'Produit cree avec succes.', tone: 'success' })
      }

      resetForm()
      await loadProducts()
    } catch (error) {
      setFeedback({ text: error.message, tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(`Supprimer le produit ${product.name} ?`)

    if (!confirmed) {
      return
    }

    try {
      await apiRequest(`/products/${product.id}`, { method: 'DELETE' }, token)
      if (editingId === product.id) {
        resetForm()
      }
      setFeedback({ text: 'Produit supprime avec succes.', tone: 'success' })
      await loadProducts()
    } catch (error) {
      setFeedback({ text: error.message, tone: 'error' })
    }
  }

  async function handleToggleStatus(product) {
    try {
      await apiRequest(`/products/${product.id}/toggle-status`, { method: 'PATCH' }, token)
      setFeedback({
        text: product.is_active ? 'Produit desactive avec succes.' : 'Produit active avec succes.',
        tone: 'success',
      })
      await loadProducts()
    } catch (error) {
      setFeedback({ text: error.message, tone: 'error' })
    }
  }

  return (
    <>
      <StatusBanner message={feedback.text} tone={feedback.tone} />
      <section className="content-grid">
        <article className="panel">
          <div className="section-heading">
            <h2>{editingId ? 'Modifier le produit' : 'Nouveau produit'}</h2>
            <p>{loading ? 'Chargement des categories...' : 'Creer un produit et televerser sa vraie image depuis l admin.'}</p>
          </div>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              <span>Categorie</span>
              <select value={form.category_id} onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))} required>
                <option value="">Selectionner</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Nom</span>
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            </label>
            <label>
              <span>Slug</span>
              <input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
            </label>
            <label>
              <span>SKU</span>
              <input value={form.sku} onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))} required />
            </label>
            <label>
              <span>Prix</span>
              <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} required />
            </label>
            <label>
              <span>Prix compare</span>
              <input type="number" min="0" step="0.01" value={form.compare_price} onChange={(event) => setForm((current) => ({ ...current, compare_price: event.target.value }))} />
            </label>
            <label>
              <span>Stock</span>
              <input type="number" min="0" step="1" value={form.stock_quantity} onChange={(event) => setForm((current) => ({ ...current, stock_quantity: event.target.value }))} />
            </label>
            <label>
              <span>Televerser une image</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageUpload} disabled={uploadingImage} />
            </label>
            <label className="full-span">
              <span>Chemin image</span>
              <input value={form.image_path} onChange={(event) => setForm((current) => ({ ...current, image_path: event.target.value }))} placeholder="products/uploads/uuid.jpg" />
            </label>
            {imagePreviewUrl ? (
              <div className="image-preview full-span">
                <img src={imagePreviewUrl} alt={form.name || 'Apercu produit'} />
              </div>
            ) : null}
            <label className="full-span">
              <span>Description courte</span>
              <input value={form.short_description} onChange={(event) => setForm((current) => ({ ...current, short_description: event.target.value }))} />
            </label>
            <label className="full-span">
              <span>Description</span>
              <textarea rows="4" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </label>
            {productValidationError ? <p className="field-error full-span">{productValidationError}</p> : null}
            <label className="checkbox-row">
              <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} />
              <span>Produit actif</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={form.is_featured} onChange={(event) => setForm((current) => ({ ...current, is_featured: event.target.checked }))} />
              <span>Produit en vedette</span>
            </label>
            <div className="action-row">
              <button className="button primary" type="submit" disabled={saving || uploadingImage || Boolean(productValidationError)}>
                {saving ? 'Enregistrement...' : editingId ? 'Mettre a jour' : 'Ajouter le produit'}
              </button>
              {editingId ? (
                <button className="button ghost" type="button" onClick={resetForm}>
                  Annuler
                </button>
              ) : null}
            </div>
          </form>
        </article>

        <article className="panel list-panel">
          <div className="section-heading">
            <h2>Produits existants</h2>
            <p>{loading ? 'Chargement...' : `${pagination.total} produits au total.`}</p>
          </div>

          <form className="filter-stack" onSubmit={handleSearchSubmit}>
            <div className="filter-row">
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Rechercher par nom, SKU, slug ou description"
              />
              <select
                value={filters.categoryId}
                onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value, page: 1 }))}
              >
                <option value="">Toutes les categories</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-row">
              <select
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}
              >
                <option value="all">Tous les etats</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
              <select
                value={filters.featured}
                onChange={(event) => setFilters((current) => ({ ...current, featured: event.target.value, page: 1 }))}
              >
                <option value="all">Tous les produits</option>
                <option value="featured">Produits en vedette</option>
              </select>
              <select
                value={filters.perPage}
                onChange={(event) => setFilters((current) => ({ ...current, perPage: Number(event.target.value), page: 1 }))}
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
              <button className="button secondary" type="submit">Filtrer</button>
            </div>
          </form>

          <div className="product-list">
            {products.map((product) => (
              <div className="product-row" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <p>{product.short_description || product.description || 'Sans description'}</p>
                  <div className="muted-line">{product.sku} | {product.slug}</div>
                </div>
                <div className="product-meta">
                  <span>{product.category?.name ?? 'Sans categorie'}</span>
                  <span>{product.price} XOF</span>
                  <span>Stock {product.stock_quantity}</span>
                  <span>{product.is_active ? 'Actif' : 'Inactif'}</span>
                  <div className="table-actions align-right">
                    <button className="mini-button" type="button" onClick={() => startEdit(product)}>
                      Editer
                    </button>
                    <button className="mini-button" type="button" onClick={() => handleToggleStatus(product)}>
                      {product.is_active ? 'Desactiver' : 'Activer'}
                    </button>
                    <button className="mini-button danger" type="button" onClick={() => handleDelete(product)}>
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pagination-row">
            <button
              className="mini-button"
              type="button"
              disabled={pagination.current_page <= 1}
              onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
            >
              Precedent
            </button>
            <span>Page {pagination.current_page} / {pagination.last_page}</span>
            <button
              className="mini-button"
              type="button"
              disabled={pagination.current_page >= pagination.last_page}
              onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
            >
              Suivant
            </button>
          </div>
        </article>
      </section>
    </>
  )
}

export default ProductsPage

