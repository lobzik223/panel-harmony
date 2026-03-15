import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { api, getMediaUrl, type ContentSection, type ContentTrack, type ContentArticle } from '../data/api'
import './SectionPage.css'
import './ContentPage.css'

type ContentTab = 'meditation' | 'sleep' | 'home' | 'articles'

const CONTENT_TABS: { value: ContentTab; label: string; type: string }[] = [
  { value: 'meditation', label: 'Медитации', type: 'MEDITATION' },
  { value: 'sleep', label: 'Сон', type: 'SLEEP' },
  { value: 'home', label: 'Главная (Гармония)', type: 'HOME' },
  { value: 'articles', label: 'Статьи', type: '' },
]

const ARTICLE_BLOCK_TYPES = [
  { value: 'FEATURED', label: 'Главная (избранное)' },
  { value: 'RECOMMENDED', label: 'Рекомендуемое' },
  { value: 'EMERGENCY', label: 'Экстренная помощь' },
]

export default function ContentPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const tabFromUrl = searchParams.get('tab') as ContentTab | null
  const [tab, setTab] = useState<ContentTab>(
    tabFromUrl && CONTENT_TABS.some((t) => t.value === tabFromUrl) ? tabFromUrl : 'meditation',
  )
  const [sections, setSections] = useState<ContentSection[]>([])
  const [tracks, setTracks] = useState<ContentTrack[]>([])
  const [articles, setArticles] = useState<ContentArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadArticles = useCallback(async () => {
    try {
      const data = await api.content.articles.get()
      setArticles(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки статей')
    }
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [secs, trks] = await Promise.all([
        api.content.sections.get(),
        api.content.tracks.get(),
      ])
      setSections(secs)
      setTracks(trks)
      await loadArticles()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [loadArticles])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    const t = searchParams.get('tab') as ContentTab | null
    if (t && CONTENT_TABS.some((x) => x.value === t)) setTab(t)
  }, [searchParams])

  const currentTabConfig = CONTENT_TABS.find((t) => t.value === tab)!
  const sectionsForType = sections.filter((s) => s.type === currentTabConfig.type)

  return (
    <div className="section-page content-page content-page-wide">
      <header className="page-header">
        <h1>Контент</h1>
        <p>Секции, треки и статьи для главного экрана приложения</p>
      </header>

      <div className="content-tabs">
        {CONTENT_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`content-tab ${tab === t.value ? 'active' : ''}`}
            onClick={() => {
              setTab(t.value)
              navigate(`/content?tab=${t.value}`, { replace: true })
            }}
          >
            {t.label}
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
      ) : tab === 'articles' ? (
        <ArticlesTab articles={articles} onReload={loadArticles} />
      ) : (
        <SplitSectionsTab
          type={currentTabConfig.type}
          typeLabel={currentTabConfig.label}
          sections={sectionsForType}
          tracks={tracks}
          onReload={loadAll}
        />
      )}
    </div>
  )
}

function SplitSectionsTab({
  type,
  typeLabel,
  sections,
  tracks,
  onReload,
}: {
  type: string
  typeLabel: string
  sections: ContentSection[]
  tracks: ContentTrack[]
  onReload: () => void
}) {
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [editingSection, setEditingSection] = useState<ContentSection | null>(null)
  const [creatingSection, setCreatingSection] = useState(false)
  const [sectionForm, setSectionForm] = useState({ name: '', slug: '', sortOrder: 0 })
  const [editingTrack, setEditingTrack] = useState<ContentTrack | null>(null)
  const [creatingTrack, setCreatingTrack] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [lastUploadSize, setLastUploadSize] = useState<number | null>(null)
  const [trackForm, setTrackForm] = useState<Partial<ContentTrack> & { sectionId: string; title: string }>({
    sectionId: '',
    title: '',
    descriptionShort: '',
    coverUrl: null,
    audioUrl: null,
    durationSeconds: null,
    level: null,
    isPremium: false,
    sortOrder: 0,
  })

  useEffect(() => {
    if (sections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(sections[0].id)
    }
  }, [sections, selectedSectionId])

  const selectedSection = sections.find((s) => s.id === selectedSectionId)
  const sectionTracks = tracks.filter((t) => t.sectionId === selectedSectionId)

  const openEditSection = (s: ContentSection) => {
    setEditingSection(s)
    setCreatingSection(false)
    setSectionForm({ name: s.name, slug: s.slug, sortOrder: s.sortOrder })
  }
  const openCreateSection = () => {
    setEditingSection(null)
    setCreatingSection(true)
    setSectionForm({ name: '', slug: '', sortOrder: sections.length })
  }
  const closeSectionForm = () => {
    setEditingSection(null)
    setCreatingSection(false)
  }

  const saveSection = async () => {
    setSaving(true)
    try {
      if (editingSection) {
        await api.content.sections.update(editingSection.id, { ...sectionForm, type })
      } else {
        await api.content.sections.create({ ...sectionForm, type })
      }
      closeSectionForm()
      onReload()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const removeSection = async (id: string) => {
    if (!confirm('Удалить секцию? Треки останутся без раздела.')) return
    try {
      await api.content.sections.delete(id)
      if (selectedSectionId === id) setSelectedSectionId(sections[0]?.id ?? null)
      closeSectionForm()
      onReload()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  const openEditTrack = (t: ContentTrack) => {
    setEditingTrack(t)
    setCreatingTrack(false)
    setLastUploadSize(null)
    setTrackForm({
      sectionId: t.sectionId,
      title: t.title,
      descriptionShort: t.descriptionShort,
      coverUrl: t.coverUrl ?? null,
      audioUrl: t.audioUrl ?? null,
      durationSeconds: t.durationSeconds ?? null,
      level: t.level ?? null,
      isPremium: t.isPremium,
      sortOrder: t.sortOrder,
    })
  }
  const openCreateTrack = () => {
    if (!selectedSectionId) {
      alert('Сначала выберите раздел слева')
      return
    }
    setEditingTrack(null)
    setCreatingTrack(true)
    setLastUploadSize(null)
    setTrackForm({
      sectionId: selectedSectionId,
      title: '',
      descriptionShort: '',
      coverUrl: null,
      audioUrl: null,
      durationSeconds: null,
      level: null,
      isPremium: false,
      sortOrder: sectionTracks.length,
    })
  }
  const closeTrackForm = () => {
    setEditingTrack(null)
    setCreatingTrack(false)
  }

  const handleCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const url = await api.content.upload.cover(file)
      setTrackForm((f) => ({ ...f, coverUrl: url }))
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
      const result = await api.content.upload.track(file)
      setTrackForm((f) => ({
        ...f,
        audioUrl: result.url,
        durationSeconds: result.durationSeconds ?? f.durationSeconds ?? null,
      }))
      setLastUploadSize(result.size ?? null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка загрузки аудио')
    } finally {
      setUploadingAudio(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} Б`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
    return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`
  }

  const saveTrack = async () => {
    if (!trackForm.sectionId || !trackForm.title.trim()) {
      alert('Укажите раздел и название')
      return
    }
    setSaving(true)
    try {
      if (editingTrack) {
        await api.content.tracks.update(editingTrack.id, trackForm)
      } else {
        await api.content.tracks.create(trackForm)
      }
      closeTrackForm()
      onReload()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const removeTrack = async (id: string) => {
    if (!confirm('Удалить трек?')) return
    try {
      await api.content.tracks.delete(id)
      closeTrackForm()
      onReload()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  const showSectionForm = creatingSection || editingSection
  const showTrackForm = creatingTrack || editingTrack

  return (
    <div className="split-sections-layout">
      <div className="split-left">
        <div className="split-panel-header">
          <h2>Разделы {typeLabel}</h2>
          <button type="button" className="add-btn add-btn-small" onClick={openCreateSection}>
            + Добавить
          </button>
        </div>

        {showSectionForm && (
          <div className="content-form-card content-form-compact">
            <h3>{editingSection ? 'Редактировать' : 'Новая секция'}</h3>
            <div className="content-form-grid content-form-grid-compact">
              <label>Название</label>
              <input
                value={sectionForm.name}
                onChange={(e) => setSectionForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Например: Утренние"
              />
              <label>Slug</label>
              <input
                value={sectionForm.slug}
                onChange={(e) => setSectionForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="morning"
              />
              <label>Порядок</label>
              <input
                type="number"
                value={sectionForm.sortOrder}
                onChange={(e) => setSectionForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="content-form-actions content-form-actions-compact">
              <button type="button" className="add-btn add-btn-small" onClick={saveSection} disabled={saving}>
                {saving ? '...' : 'Сохранить'}
              </button>
              {editingSection && (
                <button type="button" className="content-btn-danger content-btn-small" onClick={() => removeSection(editingSection.id)}>
                  Удалить
                </button>
              )}
              <button type="button" className="content-btn-secondary content-btn-small" onClick={closeSectionForm}>
                Отмена
              </button>
            </div>
          </div>
        )}

        <div className="split-sections-list">
          {sections.length === 0 ? (
            <div className="empty-section empty-section-small">
              Нет разделов. Добавьте раздел, чтобы привязать к нему треки.
            </div>
          ) : (
            [...sections]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`split-section-item ${selectedSectionId === s.id ? 'active' : ''}`}
                  onClick={() => setSelectedSectionId(s.id)}
                >
                  <span className="split-section-name">{s.name}</span>
                  <span className="split-section-meta">{s.slug}</span>
                  <div className="split-section-actions">
                    <button
                      type="button"
                      className="content-btn-icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditSection(s)
                      }}
                      title="Изменить"
                    >
                      ✎
                    </button>
                  </div>
                </button>
              ))
          )}
        </div>
      </div>

      <div className="split-right">
        <div className="split-panel-header">
          <h2>
            Треки {selectedSection ? `— ${selectedSection.name}` : ''}
          </h2>
          <button
            type="button"
            className="add-btn add-btn-small"
            onClick={openCreateTrack}
            disabled={!selectedSectionId}
          >
            + Добавить трек
          </button>
        </div>

        {!selectedSectionId && (
          <div className="empty-section empty-section-small">
            Выберите раздел слева, чтобы добавлять треки.
          </div>
        )}

        {selectedSectionId && showTrackForm && (
          <div className="content-form-card content-form-track">
            <h3>{editingTrack ? 'Редактировать трек' : 'Новый трек'}</h3>
            <div className="content-form-grid content-form-grid-wide">
              <label>Раздел</label>
              <select
                value={trackForm.sectionId}
                onChange={(e) => setTrackForm((f) => ({ ...f, sectionId: e.target.value }))}
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <label>Название</label>
              <input
                value={trackForm.title}
                onChange={(e) => setTrackForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Название трека"
              />
              <label>Описание</label>
              <textarea
                value={trackForm.descriptionShort ?? ''}
                onChange={(e) => setTrackForm((f) => ({ ...f, descriptionShort: e.target.value }))}
                placeholder="Краткое описание"
                rows={2}
              />
              <label>Обложка</label>
              <div className="content-upload-row">
                <input type="file" accept="image/*" onChange={handleCover} disabled={uploadingCover} />
                {trackForm.coverUrl && (
                  <img src={getMediaUrl(trackForm.coverUrl)} alt="" className="content-preview-img" />
                )}
                {uploadingCover && <span>Загрузка...</span>}
              </div>
              <label>Аудио</label>
              <div className="content-upload-row">
                <input type="file" accept="audio/*" onChange={handleAudio} disabled={uploadingAudio} />
                {trackForm.audioUrl && <span className="content-file-name">Файл загружен</span>}
                {lastUploadSize != null && (
                  <span className="content-file-size">Размер: {formatSize(lastUploadSize)}</span>
                )}
                {uploadingAudio && <span>Загрузка...</span>}
              </div>
              {(trackForm.durationSeconds != null && trackForm.durationSeconds > 0) && (
                <>
                  <label>Длительность</label>
                  <div className="content-readonly-value">
                    {Math.floor(trackForm.durationSeconds / 60)} мин{' '}
                    {trackForm.durationSeconds % 60 > 0 ? `${trackForm.durationSeconds % 60} сек` : ''}
                  </div>
                </>
              )}
              <label>Уровень</label>
              <input
                value={trackForm.level ?? ''}
                onChange={(e) => setTrackForm((f) => ({ ...f, level: e.target.value || null }))}
                placeholder="Например: начальный"
              />
              <label className="content-checkbox-label">
                <input
                  type="checkbox"
                  checked={trackForm.isPremium ?? false}
                  onChange={(e) => setTrackForm((f) => ({ ...f, isPremium: e.target.checked }))}
                />
                Премиум
              </label>
              <label>Порядок</label>
              <input
                type="number"
                value={trackForm.sortOrder ?? 0}
                onChange={(e) => setTrackForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="content-form-actions">
              <button type="button" className="add-btn add-btn-small" onClick={saveTrack} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              {editingTrack && (
                <button type="button" className="content-btn-danger content-btn-small" onClick={() => removeTrack(editingTrack.id)}>
                  Удалить
                </button>
              )}
              <button type="button" className="content-btn-secondary content-btn-small" onClick={closeTrackForm}>
                Отмена
              </button>
            </div>
          </div>
        )}

        {selectedSectionId && !showTrackForm && (
          <div className="content-list split-tracks-list">
            {sectionTracks.length === 0 ? (
              <div className="empty-section empty-section-small">
                Нет треков. Нажмите «+ Добавить трек», чтобы создать карточку.
              </div>
            ) : (
              [...sectionTracks]
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                .map((t) => (
                  <div key={t.id} className="content-list-item content-track-item">
                    <div className="content-track-cover">
                      {t.coverUrl ? (
                        <img src={getMediaUrl(t.coverUrl)} alt="" className="content-list-thumb" />
                      ) : (
                        <div className="content-list-thumb content-list-thumb-placeholder" />
                      )}
                    </div>
                    <div className="content-list-body">
                      <strong>{t.title}</strong>
                      <span className="content-meta">
                        {t.level || '—'} · {t.audioUrl ? 'есть аудио' : 'нет аудио'}
                      </span>
                    </div>
                    <div className="content-list-actions">
                      <button type="button" className="content-btn-small" onClick={() => openEditTrack(t)}>
                        Изменить
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </div>
    </div>
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
    <section className="card-section articles-section">
      <div className="section-title-row">
        <h2>Статьи (главный экран)</h2>
        <button type="button" className="add-btn" onClick={openCreate}>
          + Добавить статью
        </button>
      </div>

      {showForm && (
        <div className="content-form-card content-form-card-wide">
          <h3>{editing ? 'Редактировать статью' : 'Новая статья'}</h3>
          <div className="content-form-grid content-form-grid-articles">
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
