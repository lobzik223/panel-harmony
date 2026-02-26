import { useState, useEffect, useCallback } from 'react'
import { api, getMediaUrl, type ContentSection, type ContentTrack, type ContentArticle } from '../data/api'
import './SectionPage.css'
import './ContentPage.css'

type Tab = 'sections' | 'tracks' | 'articles'

const SECTION_TYPES = [
  { value: 'MEDITATION', label: 'Медитации' },
  { value: 'SLEEP', label: 'Сон' },
]
const ARTICLE_BLOCK_TYPES = [
  { value: 'FEATURED', label: 'Главная (избранное)' },
  { value: 'RECOMMENDED', label: 'Рекомендуемое' },
  { value: 'EMERGENCY', label: 'Экстренная помощь' },
]

export default function ContentPage() {
  const [tab, setTab] = useState<Tab>('sections')
  const [sections, setSections] = useState<ContentSection[]>([])
  const [tracks, setTracks] = useState<ContentTrack[]>([])
  const [articles, setArticles] = useState<ContentArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSections = useCallback(async () => {
    try {
      const data = await api.content.sections.get()
      setSections(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки секций')
    }
  }, [])
  const loadTracks = useCallback(async () => {
    try {
      const data = await api.content.tracks.get()
      setTracks(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки треков')
    }
  }, [])
  const loadArticles = useCallback(async () => {
    try {
      const data = await api.content.articles.get()
      setArticles(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки статей')
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    await Promise.all([loadSections(), loadTracks(), loadArticles()])
    setLoading(false)
  }, [loadSections, loadTracks, loadArticles])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="section-page content-page">
      <header className="page-header">
        <h1>Контент</h1>
        <p>Секции, треки и статьи для главного экрана приложения</p>
      </header>

      <div className="content-tabs">
        {(['sections', 'tracks', 'articles'] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`content-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'sections' && 'Секции'}
            {t === 'tracks' && 'Треки'}
            {t === 'articles' && 'Статьи'}
          </button>
        ))}
      </div>

      {error && (
        <div className="content-error" role="alert">
          {error}
          <button type="button" className="content-retry" onClick={() => setError(null)}>
            Закрыть
          </button>
        </div>
      )}

      {loading ? (
        <div className="page-loading">Загрузка...</div>
      ) : (
        <>
          {tab === 'sections' && <SectionsTab sections={sections} onReload={loadSections} />}
          {tab === 'tracks' && (
            <TracksTab sections={sections} tracks={tracks} onReload={loadTracks} />
          )}
          {tab === 'articles' && <ArticlesTab articles={articles} onReload={loadArticles} />}
        </>
      )}
    </div>
  )
}

function SectionsTab({ sections, onReload }: { sections: ContentSection[]; onReload: () => void }) {
  const [editing, setEditing] = useState<ContentSection | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', type: 'MEDITATION', sortOrder: 0 })

  const openEdit = (s: ContentSection) => {
    setEditing(s)
    setCreating(false)
    setForm({ name: s.name, slug: s.slug, type: s.type, sortOrder: s.sortOrder })
  }
  const openCreate = () => {
    setEditing(null)
    setCreating(true)
    setForm({ name: '', slug: '', type: 'MEDITATION', sortOrder: sections.length })
  }
  const closeForm = () => {
    setEditing(null)
    setCreating(false)
  }

  const save = async () => {
    setSaving(true)
    try {
      if (editing) {
        await api.content.sections.update(editing.id, form)
      } else {
        await api.content.sections.create(form)
      }
      closeForm()
      onReload()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Удалить секцию? Треки останутся без раздела.')) return
    try {
      await api.content.sections.delete(id)
      closeForm()
      onReload()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  const showForm = creating || editing

  return (
    <section className="card-section">
      <div className="section-title-row">
        <h2>Разделы (медитации / сон)</h2>
        <button type="button" className="add-btn" onClick={openCreate}>
          + Добавить секцию
        </button>
      </div>

      {showForm && (
        <div className="content-form-card">
          <h3>{editing ? 'Редактировать секцию' : 'Новая секция'}</h3>
          <div className="content-form-grid">
            <label>Название</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Например: Утренние медитации"
            />
            <label>Slug (латиница)</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="morning"
            />
            <label>Тип</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {SECTION_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <label>Порядок</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
            />
          </div>
          <div className="content-form-actions">
            <button type="button" className="add-btn" onClick={save} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            {editing && (
              <button type="button" className="content-btn-danger" onClick={() => remove(editing.id)}>
                Удалить
              </button>
            )}
            <button type="button" className="content-btn-secondary" onClick={closeForm}>
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="content-list">
        {sections.length === 0 ? (
          <div className="empty-section">
            Нет секций. Добавьте секцию, чтобы привязать к ней треки.
          </div>
        ) : (
          [...sections]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((s) => (
              <div key={s.id} className="content-list-item">
                <div>
                  <strong>{s.name}</strong>
                  <span className="content-meta">
                    {' '}
                    {s.slug} · {s.type} · порядок {s.sortOrder}
                  </span>
                </div>
                <div className="content-list-actions">
                  <button type="button" className="content-btn-small" onClick={() => openEdit(s)}>
                    Изменить
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </section>
  )
}

function TracksTab({
  sections,
  tracks,
  onReload,
}: {
  sections: ContentSection[]
  tracks: ContentTrack[]
  onReload: () => void
}) {
  const [editing, setEditing] = useState<ContentTrack | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [form, setForm] = useState<Partial<ContentTrack> & { sectionId: string; title: string }>({
    sectionId: sections[0]?.id ?? '',
    title: '',
    descriptionShort: '',
    coverUrl: null,
    audioUrl: null,
    level: null,
    isPremium: false,
    sortOrder: 0,
  })

  const openEdit = (t: ContentTrack) => {
    setEditing(t)
    setCreating(false)
    setForm({
      sectionId: t.sectionId,
      title: t.title,
      descriptionShort: t.descriptionShort,
      coverUrl: t.coverUrl ?? null,
      audioUrl: t.audioUrl ?? null,
      level: t.level ?? null,
      isPremium: t.isPremium,
      sortOrder: t.sortOrder,
    })
  }
  const openCreate = () => {
    setEditing(null)
    setCreating(true)
    setForm({
      sectionId: sections[0]?.id ?? '',
      title: '',
      descriptionShort: '',
      coverUrl: null,
      audioUrl: null,
      level: null,
      isPremium: false,
      sortOrder: tracks.length,
    })
  }
  const closeForm = () => {
    setEditing(null)
    setCreating(false)
  }

  const handleCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const url = await api.content.upload.cover(file)
      setForm((f) => ({ ...f, coverUrl: url }))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка загрузки обложки')
    } finally {
      setUploadingCover(false)
    }
  }
  const handleAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAudio(true)
    try {
      const url = await api.content.upload.track(file)
      setForm((f) => ({ ...f, audioUrl: url }))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка загрузки аудио')
    } finally {
      setUploadingAudio(false)
    }
  }

  const save = async () => {
    if (!form.sectionId || !form.title.trim()) {
      alert('Укажите раздел и название')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await api.content.tracks.update(editing.id, form)
      } else {
        await api.content.tracks.create(form)
      }
      closeForm()
      onReload()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Удалить трек?')) return
    try {
      await api.content.tracks.delete(id)
      closeForm()
      onReload()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  const showForm = creating || editing
  const sectionMap = Object.fromEntries(sections.map((s) => [s.id, s]))

  return (
    <section className="card-section">
      <div className="section-title-row">
        <h2>Треки (аудиокарточки)</h2>
        <button
          type="button"
          className="add-btn"
          onClick={openCreate}
          disabled={sections.length === 0}
        >
          + Добавить трек
        </button>
      </div>
      {sections.length === 0 && (
        <p className="content-hint">Сначала создайте секцию во вкладке «Секции».</p>
      )}

      {showForm && (
        <div className="content-form-card content-form-card-wide">
          <h3>{editing ? 'Редактировать трек' : 'Новый трек'}</h3>
          <div className="content-form-grid">
            <label>Раздел</label>
            <select
              value={form.sectionId}
              onChange={(e) => setForm((f) => ({ ...f, sectionId: e.target.value }))}
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <label>Название</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Название трека"
            />
            <label>Краткое описание</label>
            <textarea
              value={form.descriptionShort ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, descriptionShort: e.target.value }))}
              placeholder="Краткое описание"
              rows={2}
            />
            <label>Обложка</label>
            <div className="content-upload-row">
              <input type="file" accept="image/*" onChange={handleCover} disabled={uploadingCover} />
              {form.coverUrl && (
                <img src={getMediaUrl(form.coverUrl)} alt="" className="content-preview-img" />
              )}
              {uploadingCover && <span>Загрузка...</span>}
            </div>
            <label>Аудиофайл</label>
            <div className="content-upload-row">
              <input type="file" accept="audio/*" onChange={handleAudio} disabled={uploadingAudio} />
              {form.audioUrl && <span className="content-file-name">Файл загружен</span>}
              {uploadingAudio && <span>Загрузка...</span>}
            </div>
            <label>Уровень</label>
            <input
              value={form.level ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, level: e.target.value || null }))}
              placeholder="Например: начальный"
            />
            <label className="content-checkbox-label">
              <input
                type="checkbox"
                checked={form.isPremium ?? false}
                onChange={(e) => setForm((f) => ({ ...f, isPremium: e.target.checked }))}
              />
              Премиум
            </label>
            <label>Порядок</label>
            <input
              type="number"
              value={form.sortOrder ?? 0}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
            />
          </div>
          <div className="content-form-actions">
            <button type="button" className="add-btn" onClick={save} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            {editing && (
              <button type="button" className="content-btn-danger" onClick={() => remove(editing.id)}>
                Удалить
              </button>
            )}
            <button type="button" className="content-btn-secondary" onClick={closeForm}>
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="content-list">
        {tracks.length === 0 ? (
          <div className="empty-section">
            Нет треков. Добавьте трек и привяжите обложку и аудио.
          </div>
        ) : (
          [...tracks]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((t) => (
              <div key={t.id} className="content-list-item content-track-item">
                {t.coverUrl && (
                  <img src={getMediaUrl(t.coverUrl)} alt="" className="content-list-thumb" />
                )}
                <div className="content-list-body">
                  <strong>{t.title}</strong>
                  <span className="content-meta">
                    {sectionMap[t.sectionId]?.name ?? t.sectionId} ·{' '}
                    {t.audioUrl ? 'есть аудио' : 'нет аудио'}
                  </span>
                </div>
                <div className="content-list-actions">
                  <button type="button" className="content-btn-small" onClick={() => openEdit(t)}>
                    Изменить
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </section>
  )
}

function ArticlesTab({ articles, onReload }: { articles: ContentArticle[]; onReload: () => void }) {
  const [editing, setEditing] = useState<ContentArticle | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [form, setForm] = useState<Partial<ContentArticle> & { blockType: string; title: string }>({
    blockType: 'FEATURED',
    title: '',
    descriptionShort: '',
    descriptionFull: '',
    imageUrl: null,
    sortOrder: 0,
  })

  const openEdit = (a: ContentArticle) => {
    setEditing(a)
    setCreating(false)
    setForm({
      blockType: a.blockType,
      title: a.title,
      descriptionShort: a.descriptionShort,
      descriptionFull: a.descriptionFull ?? '',
      imageUrl: a.imageUrl ?? null,
      sortOrder: a.sortOrder,
    })
  }
  const openCreate = () => {
    setEditing(null)
    setCreating(true)
    setForm({
      blockType: 'FEATURED',
      title: '',
      descriptionShort: '',
      descriptionFull: '',
      imageUrl: null,
      sortOrder: articles.length,
    })
  }
  const closeForm = () => {
    setEditing(null)
    setCreating(false)
  }

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const url = await api.content.upload.articleImage(file)
      setForm((f) => ({ ...f, imageUrl: url }))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка загрузки изображения')
    } finally {
      setUploadingImage(false)
    }
  }

  const save = async () => {
    if (!form.title.trim()) {
      alert('Укажите заголовок')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await api.content.articles.update(editing.id, form)
      } else {
        await api.content.articles.create({
          blockType: form.blockType,
          title: form.title,
          descriptionShort: form.descriptionShort ?? undefined,
          descriptionFull: form.descriptionFull ?? undefined,
          imageUrl: form.imageUrl ?? undefined,
          sortOrder: form.sortOrder ?? undefined,
        })
      }
      closeForm()
      onReload()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Удалить статью?')) return
    try {
      await api.content.articles.delete(id)
      closeForm()
      onReload()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  const showForm = creating || editing
  const blockLabel = (v: string) => ARTICLE_BLOCK_TYPES.find((o) => o.value === v)?.label ?? v

  return (
    <section className="card-section">
      <div className="section-title-row">
        <h2>Статьи (главный экран)</h2>
        <button type="button" className="add-btn" onClick={openCreate}>
          + Добавить статью
        </button>
      </div>

      {showForm && (
        <div className="content-form-card content-form-card-wide">
          <h3>{editing ? 'Редактировать статью' : 'Новая статья'}</h3>
          <div className="content-form-grid">
            <label>Блок на главной</label>
            <select
              value={form.blockType}
              onChange={(e) => setForm((f) => ({ ...f, blockType: e.target.value }))}
            >
              {ARTICLE_BLOCK_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <label>Заголовок</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Заголовок"
            />
            <label>Краткое описание</label>
            <textarea
              value={form.descriptionShort ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, descriptionShort: e.target.value }))}
              placeholder="Краткое описание"
              rows={2}
            />
            <label>Полное описание</label>
            <textarea
              value={form.descriptionFull ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, descriptionFull: e.target.value }))}
              placeholder="Полный текст статьи"
              rows={6}
            />
            <label>Изображение</label>
            <div className="content-upload-row">
              <input type="file" accept="image/*" onChange={handleImage} disabled={uploadingImage} />
              {form.imageUrl && (
                <img src={getMediaUrl(form.imageUrl)} alt="" className="content-preview-img" />
              )}
              {uploadingImage && <span>Загрузка...</span>}
            </div>
            <label>Порядок</label>
            <input
              type="number"
              value={form.sortOrder ?? 0}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
            />
          </div>
          <div className="content-form-actions">
            <button type="button" className="add-btn" onClick={save} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            {editing && (
              <button type="button" className="content-btn-danger" onClick={() => remove(editing.id)}>
                Удалить
              </button>
            )}
            <button type="button" className="content-btn-secondary" onClick={closeForm}>
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="content-list">
        {articles.length === 0 ? (
          <div className="empty-section">
            Нет статей. Статьи показываются на главном экране приложения.
          </div>
        ) : (
          [...articles]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((a) => (
              <div key={a.id} className="content-list-item content-track-item">
                {a.imageUrl && (
                  <img src={getMediaUrl(a.imageUrl)} alt="" className="content-list-thumb" />
                )}
                <div className="content-list-body">
                  <strong>{a.title}</strong>
                  <span className="content-meta">{blockLabel(a.blockType)}</span>
                </div>
                <div className="content-list-actions">
                  <button type="button" className="content-btn-small" onClick={() => openEdit(a)}>
                    Изменить
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </section>
  )
}
