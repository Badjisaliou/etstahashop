import { useEffect, useMemo, useState } from 'react'
import StatusBanner from '../components/StatusBanner'
import { useAdminAuth } from '../auth'
import { apiRequest } from '../lib/api'

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  parent_id: '',
  is_active: true,
}

const initialFilters = {
  search: '',
  status: 'all',
  perPage: 10,
  page: 1,
}

function CategoriesPage() {
  const { token } = useAdminAuth()
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [filters, setFilters] = useState(initialFilters)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [feedback, setFeedback] = useState({ text: '', tone: 'info' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const parentCategories = useMemo(
    () => categories.filter((category) => !category.parent_id || category.id === editingId),
    [categories, editingId],
  )

  const categoryValidationError = useMemo(() => {
    if (!form.name.trim()) {
      return 'Le nom de categorie est requis.'
    }

    return ''
  }, [form.name])

  useEffect(() => {
    loadCategories()
  }, [filters.page, filters.perPage, filters.status])

  async function loadCategories(customFilters = filters) {
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

      const response = await apiRequest(`/categories?${searchParams.toString()}`, {}, token)
      setCategories(response.data ?? [])
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

  function startEdit(category) {
    setEditingId(category.id)
    setForm({
      name: category.name,
      slug: category.slug ?? '',
      description: category.description ?? '',
      parent_id: category.parent_id ? String(category.parent_id) : '',
      is_active: Boolean(category.is_active),
    })
    setFeedback({ text: 'Edition de categorie activee.', tone: 'info' })
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function handleSearchSubmit(event) {
    event.preventDefault()
    const nextFilters = { ...filters, page: 1 }
    setFilters(nextFilters)
    loadCategories(nextFilters)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (categoryValidationError) {
      setFeedback({ text: categoryValidationError, tone: 'error' })
      return
    }

    setSaving(true)

    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      description: form.description || undefined,
      parent_id: form.parent_id ? Number(form.parent_id) : null,
      is_active: form.is_active,
    }

    try {
      if (editingId) {
        await apiRequest(`/categories/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) }, token)
        setFeedback({ text: 'Categorie modifiee avec succes.', tone: 'success' })
      } else {
        await apiRequest('/categories', { method: 'POST', body: JSON.stringify(payload) }, token)
        setFeedback({ text: 'Categorie creee avec succes.', tone: 'success' })
      }

      resetForm()
      await loadCategories()
    } catch (error) {
      setFeedback({ text: error.message, tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(category) {
    const confirmed = window.confirm(`Supprimer la categorie ${category.name} ?`)

    if (!confirmed) {
      return
    }

    try {
      await apiRequest(`/categories/${category.id}`, { method: 'DELETE' }, token)
      if (editingId === category.id) {
        resetForm()
      }
      setFeedback({ text: 'Categorie supprimee avec succes.', tone: 'success' })
      await loadCategories()
    } catch (error) {
      setFeedback({ text: error.message, tone: 'error' })
    }
  }

  async function handleToggleStatus(category) {
    try {
      await apiRequest(`/categories/${category.id}/toggle-status`, { method: 'PATCH' }, token)
      setFeedback({
        text: category.is_active ? 'Categorie desactivee avec succes.' : 'Categorie activee avec succes.',
        tone: 'success',
      })
      await loadCategories()
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
            <h2>{editingId ? 'Modifier la categorie' : 'Nouvelle categorie'}</h2>
            <p>Creer une categorie mere ou une sous-categorie, puis la mettre a jour si besoin.</p>
          </div>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              <span>Nom de la categorie</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ex: Accessoires"
                required
              />
            </label>
            <label>
              <span>URL simplifiee (slug)</span>
              <input
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                placeholder="Ex: accessoires-telephone"
              />
            </label>
            <label>
              <span>Categorie parente</span>
              <select value={form.parent_id} onChange={(event) => setForm((current) => ({ ...current, parent_id: event.target.value }))}>
                <option value="">Aucun</option>
                {parentCategories
                  .filter((category) => category.id !== editingId)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="full-span">
              <span>Description de la categorie</span>
              <textarea
                rows="4"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Description visible pour mieux organiser le catalogue."
              />
            </label>
            {categoryValidationError ? <p className="field-error full-span">{categoryValidationError}</p> : null}
            <label className="checkbox-row">
              <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} />
              <span>Categorie visible sur la boutique</span>
            </label>
            <div className="action-row">
              <button className="button primary" type="submit" disabled={saving || Boolean(categoryValidationError)}>
                {saving ? 'Enregistrement...' : editingId ? 'Mettre a jour' : 'Ajouter la categorie'}
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
            <h2>Categories existantes</h2>
            <p>{loading ? 'Chargement...' : `${pagination.total} categories au total.`}</p>
          </div>

          <form className="filter-row" onSubmit={handleSearchSubmit}>
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Rechercher par nom, slug ou description"
            />
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}
            >
              <option value="all">Tous les etats</option>
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
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
          </form>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Parent</th>
                  <th>Produits</th>
                  <th>Etat</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <strong>{category.name}</strong>
                      <div className="muted-line">{category.slug}</div>
                    </td>
                    <td>{category.parent?.name ?? 'Aucun'}</td>
                    <td>{category.products_count}</td>
                    <td>{category.is_active ? 'Active' : 'Inactive'}</td>
                    <td>
                      <div className="table-actions">
                        <button className="mini-button" type="button" onClick={() => startEdit(category)}>
                          Editer
                        </button>
                        <button className="mini-button" type="button" onClick={() => handleToggleStatus(category)}>
                          {category.is_active ? 'Desactiver' : 'Activer'}
                        </button>
                        <button className="mini-button danger" type="button" onClick={() => handleDelete(category)}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default CategoriesPage

