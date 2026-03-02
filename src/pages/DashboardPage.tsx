import { useState, useEffect } from 'react'
import { api, getMediaUrl, type ContentArticle } from '../data/api'
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react'
import './SectionPage.css'

const SECTION_TITLE = 'О силе мышления'
const BLOCK_TYPE = 'RECOMMENDED'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function DashboardPage() {
  const [cards, setCards] = useState<ContentArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    descriptionShort: '',
    descriptionFull: '',
    imageUrl: '',
    publishedAt: '',
  })

  const loadCards = () => {
    setLoading(true)
    api.content.articles
      .get(BLOCK_TYPE)
      .then((list) => {
        setCards(list)
        setError(null)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCards()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm({
      title: '',
      descriptionShort: '',
      descriptionFull: '',
      imageUrl: '',
      publishedAt: new Date().toISOString().slice(0, 10),
    })
    setFormOpen(true)
  }

  const openEdit = (a: ContentArticle) => {
    setEditingId(a.id)
    setForm({
      title: a.title,
      descriptionShort: a.descriptionShort ?? '',
      descriptionFull: a.descriptionFull ?? '',
      imageUrl: a.imageUrl ?? '',
      publishedAt: a.publishedAt ? a.publishedAt.slice(0, 10) : '',
    })
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    api.content.upload.articleImage(file).then((url) => {
      setForm((f) => ({ ...f, imageUrl: url }))
    }).catch((err) => alert(err instanceof Error ? err.message : 'Ошибка загрузки'))
  }

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    const payload = {
      blockType: BLOCK_TYPE,
      title: form.title.trim(),
      descriptionShort: form.descriptionShort.trim() || undefined,
      descriptionFull: form.descriptionFull.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      publishedAt: form.publishedAt || undefined,
    }
    const promise = editingId
      ? api.content.articles.update(editingId, payload)
      : api.content.articles.create(payload)
    promise
      .then(() => {
        closeForm()
        loadCards()
      })
      .catch((err) => alert(err instanceof Error ? err.message : 'Ошибка сохранения'))
      .finally(() => setSaving(false))
  }

  const deleteCard = (id: string) => {
    if (!confirm('Удалить карточку?')) return
    api.content.articles
      .delete(id)
      .then(() => loadCards())
      .catch((err) => alert(err instanceof Error ? err.message : 'Ошибка удаления'))
  }

  if (loading && cards.length === 0) {
    return (
      <div className="section-page">
        <header className="page-header">
          <h1>Главная</h1>
          <p>Панель управления Harmony</p>
        </header>
        <div className="page-loading">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="section-page">
      <header className="page-header">
        <h1>Главная</h1>
        <p>Панель управления Harmony</p>
      </header>

      {error && (
        <div className="page-error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <section className="card-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>Раздел в приложении: «{SECTION_TITLE}»</h2>
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus size={18} /> Добавить карточку
          </button>
        </div>
        <p style={{ color: '#64748b', marginBottom: 16 }}>
          Эти карточки отображаются на главном экране приложения в разделе «{SECTION_TITLE}». Обложка, описание и дата публикации.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cards.length === 0 ? (
            <div style={{ padding: 24, background: '#f8fafc', borderRadius: 12, color: '#64748b' }}>
              Карточек пока нет. Нажмите «Добавить карточку».
            </div>
          ) : (
            cards.map((card) => (
              <div
                key={card.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 16,
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 56,
                    borderRadius: 8,
                    background: '#e2e8f0',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {card.imageUrl ? (
                    <img
                      src={getMediaUrl(card.imageUrl)}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={24} color="#94a3b8" />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{card.title}</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    {card.publishedAt ? formatDate(card.publishedAt) : '—'}
                  </div>
                  {card.descriptionShort && (
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{card.descriptionShort.slice(0, 80)}…</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn-secondary" onClick={() => openEdit(card)}>
                    <Pencil size={16} />
                  </button>
                  <button type="button" className="btn-danger" onClick={() => deleteCard(card.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {formOpen && (
        <div
          className="modal-overlay"
          onClick={closeForm}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 24,
              maxWidth: 480,
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <h3 style={{ marginTop: 0 }}>{editingId ? 'Редактировать карточку' : 'Добавить карточку'}</h3>
            <form onSubmit={submitForm}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Название</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Краткое описание (над карточкой)</label>
                <textarea
                  value={form.descriptionShort}
                  onChange={(e) => setForm((f) => ({ ...f, descriptionShort: e.target.value }))}
                  rows={2}
                  style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Полное описание (внутри карточки)</label>
                <textarea
                  value={form.descriptionFull}
                  onChange={(e) => setForm((f) => ({ ...f, descriptionFull: e.target.value }))}
                  rows={4}
                  style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Обложка</label>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>JPG, PNG или WebP, до 1 МБ</p>
                {form.imageUrl && (
                  <div style={{ marginTop: 8 }}>
                    <img src={getMediaUrl(form.imageUrl)} alt="" style={{ maxWidth: 120, maxHeight: 80, objectFit: 'cover', borderRadius: 8 }} />
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Дата (когда отправить в обработку)</label>
                <input
                  type="date"
                  value={form.publishedAt}
                  onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
                  style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={closeForm}>
                  Отмена
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Сохранение…' : editingId ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
