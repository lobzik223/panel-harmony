import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { api, getMediaUrl, type ContentSection, type ContentTrack, type ContentArticle, type ContentCourse } from '../data/api'
import './SectionPage.css'
import './ContentPage.css'

type ContentMode = 'main' | 'sleep' | 'meditation'

export default function ContentPage() {
  const location = useLocation()
  const mode: ContentMode =
    location.pathname === '/content/sleep' ? 'sleep' :
    location.pathname === '/content/meditation' ? 'meditation' : 'main'

  const [sections, setSections] = useState<ContentSection[]>([])
  const [tracks, setTracks] = useState<ContentTrack[]>([])
  const [articles, setArticles] = useState<ContentArticle[]>([])
  const [courses, setCourses] = useState<ContentCourse[]>([])
  const [popularTracks, setPopularTracks] = useState<ContentTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [secs, trks, arts, crs, pop] = await Promise.all([
        api.content.sections.get(),
        api.content.tracks.get(),
        api.content.articles.get(),
        api.content.courses.get(),
        api.content.tracks.popular(20),
      ])
      setSections(secs)
      setTracks(trks)
      setArticles(arts)
      setCourses(crs)
      setPopularTracks(pop)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const pageTitle =
    mode === 'main' ? 'Главный экран' :
    mode === 'sleep' ? 'Сон' : 'Медитации'

  return (
    <div className="section-page content-page content-page-wide">
      <header className="page-header">
        <h1>{pageTitle}</h1>
        <p>
          {mode === 'main' && 'О силе мышления, популярные треки, курсы и разделы главного экрана'}
          {mode === 'sleep' && 'Разделы и треки для экрана «Сон»'}
          {mode === 'meditation' && 'Разделы и треки для экрана «Медитации»'}
        </p>
      </header>

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
      ) : mode === 'main' ? (
        <MainTab
          articles={articles}
          popularTracks={popularTracks}
          courses={courses}
          sections={sections}
          tracks={tracks}
          onReload={loadAll}
        />
      ) : (
        <SplitSectionsTab
          type={mode === 'sleep' ? 'SLEEP' : 'MEDITATION'}
          typeLabel={mode === 'sleep' ? 'Сон' : 'Медитации'}
          sections={sections.filter((s) => s.type === (mode === 'sleep' ? 'SLEEP' : 'MEDITATION'))}
          tracks={tracks}
          onReload={loadAll}
        />
      )}
    </div>
  )
}

/** Главный экран: О силе мышления, Популярные от Harmony, Курсы, Разделы главного экрана */
function MainTab({
  articles,
  popularTracks,
  courses,
  sections,
  tracks,
  onReload,
}: {
  articles: ContentArticle[]
  popularTracks: ContentTrack[]
  courses: ContentCourse[]
  sections: ContentSection[]
  tracks: ContentTrack[]
  onReload: () => void
}) {
  const mindPowerArticles = articles.filter((a) => a.blockType === 'RECOMMENDED')
  const homeSections = sections.filter((s) => s.type === 'HOME')

  return (
    <div className="main-tab">
      <MindPowerSection articles={mindPowerArticles} onReload={onReload} />
      <PopularSection tracks={popularTracks} />
      <CoursesSection courses={courses} onReload={onReload} />
      <HomeSectionsBlock sections={homeSections} tracks={tracks} onReload={onReload} />
    </div>
  )
}

const SECTION_NAME_MIND = 'О силе мышления'

function MindPowerSection({ articles, onReload }: { articles: ContentArticle[]; onReload: () => void }) {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<ContentArticle | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [useCustomPublishTime, setUseCustomPublishTime] = useState(false)
  const [form, setForm] = useState({
    title: '',
    descriptionShort: '',
    descriptionFull: '',
    imageUrl: null as string | null,
    sortOrder: 0,
    publishedAt: '',
    publishTime: '12:00',
  })

  const openCreate = () => {
    setEditing(null)
    setCreating(true)
    setUseCustomPublishTime(false)
    setForm({
      title: '',
      descriptionShort: '',
      descriptionFull: '',
      imageUrl: null,
      sortOrder: articles.length,
      publishedAt: new Date().toISOString().slice(0, 10),
      publishTime: '12:00',
    })
  }
  const openEdit = (a: ContentArticle) => {
    setEditing(a)
    setCreating(false)
    const pub = a.publishedAt ? new Date(a.publishedAt) : null
    setUseCustomPublishTime(!!pub)
    setForm({
      title: a.title,
      descriptionShort: a.descriptionShort,
      descriptionFull: a.descriptionFull ?? '',
      imageUrl: a.imageUrl ?? null,
      sortOrder: a.sortOrder,
      publishedAt: pub ? pub.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      publishTime: pub ? `${String(pub.getHours()).padStart(2, '0')}:${String(pub.getMinutes()).padStart(2, '0')}` : '12:00',
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
      alert('Укажите название карточки')
      return
    }
    if (useCustomPublishTime && (!form.publishedAt || !form.publishTime)) {
      alert('Укажите дату и время публикации')
      return
    }
    setSaving(true)
    try {
      let publishedAt: string | undefined
      if (useCustomPublishTime && form.publishedAt && form.publishTime) {
        const [h, m] = form.publishTime.split(':').map(Number)
        const d = new Date(form.publishedAt)
        d.setHours(h || 0, m || 0, 0, 0)
        publishedAt = d.toISOString()
      }
      if (editing) {
        await api.content.articles.update(editing.id, {
          title: form.title,
          descriptionShort: form.descriptionShort,
          descriptionFull: form.descriptionFull || undefined,
          imageUrl: form.imageUrl ?? undefined,
          sortOrder: form.sortOrder,
          publishedAt: publishedAt ?? editing.publishedAt ?? undefined,
        })
      } else {
        await api.content.articles.create({
          blockType: 'RECOMMENDED',
          title: form.title,
          descriptionShort: form.descriptionShort,
          descriptionFull: form.descriptionFull || undefined,
          imageUrl: form.imageUrl ?? undefined,
          sortOrder: form.sortOrder,
          publishedAt,
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
    if (!confirm('Удалить карточку?')) return
    try {
      await api.content.articles.delete(id)
      closeForm()
      onReload()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  const showForm = creating || editing

  return (
    <section className="main-block">
      <div className="main-block-header">
        <h2>{SECTION_NAME_MIND}</h2>
        <button type="button" className="add-btn add-btn-small" onClick={openCreate}>
          + Добавить карточку
        </button>
      </div>

      {showForm && (
        <div className="content-form-card main-form-card">
          <h3>Добавление карточки в раздел «{SECTION_NAME_MIND}»</h3>
          <div className="content-form-grid content-form-grid-wide">
            <label htmlFor="mp-title">Название карточки</label>
            <input
              id="mp-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Название"
            />
            <label htmlFor="mp-short">Краткое описание</label>
            <textarea
              id="mp-short"
              value={form.descriptionShort}
              onChange={(e) => setForm((f) => ({ ...f, descriptionShort: e.target.value }))}
              placeholder="Краткое описание"
              rows={2}
            />
            <label htmlFor="mp-full">Полное описание</label>
            <textarea
              id="mp-full"
              value={form.descriptionFull}
              onChange={(e) => setForm((f) => ({ ...f, descriptionFull: e.target.value }))}
              placeholder="Полный текст"
              rows={4}
            />
            <label>Обложка</label>
            <div className="content-upload-row">
              <input type="file" accept="image/*" onChange={handleImage} disabled={uploadingImage} />
              {form.imageUrl && (
                <img src={getMediaUrl(form.imageUrl)} alt="" className="content-preview-img" />
              )}
              {uploadingImage && <span>Загрузка...</span>}
            </div>
            <label className="content-checkbox-label">
              <input
                type="checkbox"
                checked={useCustomPublishTime}
                onChange={(e) => setUseCustomPublishTime(e.target.checked)}
              />
              Указать своё время публикации
            </label>
            {useCustomPublishTime && (
              <>
                <label htmlFor="mp-date">Дата публикации</label>
                <input
                  id="mp-date"
                  type="date"
                  value={form.publishedAt}
                  onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
                />
                <label htmlFor="mp-time">Время публикации</label>
                <input
                  id="mp-time"
                  type="time"
                  value={form.publishTime}
                  onChange={(e) => setForm((f) => ({ ...f, publishTime: e.target.value }))}
                />
              </>
            )}
            <label htmlFor="mp-order">Порядок</label>
            <input
              id="mp-order"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
            />
          </div>
          <div className="content-form-actions">
            <button type="button" className="add-btn add-btn-small" onClick={save} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            {editing && (
              <button type="button" className="content-btn-danger content-btn-small" onClick={() => remove(editing.id)}>
                Удалить
              </button>
            )}
            <button type="button" className="content-btn-secondary content-btn-small" onClick={closeForm}>
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="cards-row">
        {articles.length === 0 ? (
          <div className="empty-section empty-section-small">Нет карточек. Нажмите «+ Добавить карточку».</div>
        ) : (
          [...articles]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((a) => (
              <div key={a.id} className="card-tile">
                {a.imageUrl ? (
                  <img src={getMediaUrl(a.imageUrl)} alt="" className="card-tile-img" />
                ) : (
                  <div className="card-tile-img card-tile-placeholder" />
                )}
                <div className="card-tile-body">
                  <strong>{a.title}</strong>
                  <span className="content-meta">
                    {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('ru-RU') : '—'}
                  </span>
                </div>
                <button type="button" className="content-btn-small" onClick={() => openEdit(a)}>
                  Изменить
                </button>
              </div>
            ))
        )}
      </div>
    </section>
  )
}

function PopularSection({ tracks }: { tracks: ContentTrack[] }) {
  return (
    <section className="main-block">
      <div className="main-block-header">
        <h2>Популярные от Harmony</h2>
      </div>
      <div className="cards-row">
        {tracks.length === 0 ? (
          <div className="empty-section empty-section-small">Нет данных о прослушиваниях за последние 7 дней.</div>
        ) : (
          tracks.map((t) => (
            <div key={t.id} className="card-tile">
              {t.coverUrl ? (
                <img src={getMediaUrl(t.coverUrl)} alt="" className="card-tile-img" />
              ) : (
                <div className="card-tile-img card-tile-placeholder" />
              )}
              <div className="card-tile-body">
                <strong>{t.title}</strong>
                <span className="content-meta content-listen-count">
                  {(t as ContentTrack & { listenCount?: number }).listenCount ?? 0} прослушиваний
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function CoursesSection({ courses, onReload }: { courses: ContentCourse[]; onReload: () => void }) {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<ContentCourse | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingTrack, setUploadingTrack] = useState(false)
  const [form, setForm] = useState({
    title: '',
    descriptionShort: '',
    descriptionFull: '',
    imageUrl: null as string | null,
    sortOrder: 0,
    isPublished: true,
    tracks: [] as Array<{ title: string; descriptionShort: string; mediaUrl: string }>,
  })

  const openCreate = () => {
    setEditing(null)
    setCreating(true)
    setForm({
      title: '',
      descriptionShort: '',
      descriptionFull: '',
      imageUrl: null,
      sortOrder: courses.length,
      isPublished: true,
      tracks: [],
    })
  }
  const openEdit = (c: ContentCourse) => {
    setEditing(c)
    setCreating(false)
    setForm({
      title: c.title,
      descriptionShort: c.descriptionShort,
      descriptionFull: c.descriptionFull ?? '',
      imageUrl: c.imageUrl ?? null,
      sortOrder: c.sortOrder,
      isPublished: c.isPublished,
      tracks: (c.courseTrackItems ?? []).map((t) => ({
        title: t.title,
        descriptionShort: t.descriptionShort ?? '',
        mediaUrl: t.mediaUrl,
      })),
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
      const url = await api.content.upload.cover(file)
      setForm((f) => ({ ...f, imageUrl: url }))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка загрузки обложки')
    } finally {
      setUploadingImage(false)
    }
  }

  const addTrack = () => {
    setForm((f) => ({
      ...f,
      tracks: [...f.tracks, { title: '', descriptionShort: '', mediaUrl: '' }],
    }))
  }
  const updateTrack = (idx: number, field: string, value: string) => {
    setForm((f) => {
      const next = [...f.tracks]
      next[idx] = { ...next[idx], [field]: value }
      return { ...f, tracks: next }
    })
  }
  const removeTrack = (idx: number) => {
    setForm((f) => ({
      ...f,
      tracks: f.tracks.filter((_, i) => i !== idx),
    }))
  }
  const handleTrackFile = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingTrack(true)
    try {
      const result = await api.content.upload.courseTrack(file)
      updateTrack(idx, 'mediaUrl', result.url)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка загрузки трека')
    } finally {
      setUploadingTrack(false)
    }
  }

  const save = async () => {
    if (!form.title.trim()) {
      alert('Укажите название курса')
      return
    }
    if (form.tracks.some((t) => !t.mediaUrl || !t.title.trim())) {
      alert('У каждого трека должны быть название и загруженный файл')
      return
    }
    setSaving(true)
    try {
      const body = {
        title: form.title,
        descriptionShort: form.descriptionShort,
        descriptionFull: form.descriptionFull || undefined,
        imageUrl: form.imageUrl ?? undefined,
        sortOrder: form.sortOrder,
        isPublished: form.isPublished,
        tracks: form.tracks.map((t) => ({
          title: t.title,
          descriptionShort: t.descriptionShort || undefined,
          mediaUrl: t.mediaUrl,
        })),
      }
      if (editing) {
        await api.content.courses.update(editing.id, body)
      } else {
        await api.content.courses.create(body)
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
    if (!confirm('Удалить курс?')) return
    try {
      await api.content.courses.delete(id)
      closeForm()
      onReload()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  const showForm = creating || editing

  return (
    <section className="main-block">
      <div className="main-block-header">
        <h2>Курсы</h2>
        <button type="button" className="add-btn add-btn-small" onClick={openCreate}>
          + Добавить курс
        </button>
      </div>

      {showForm && (
        <div className="content-form-card main-form-card courses-form">
          <h3>{editing ? 'Редактировать курс' : 'Новый курс'}</h3>
          <div className="content-form-grid content-form-grid-wide">
            <label htmlFor="cr-title">Название</label>
            <input
              id="cr-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Название курса"
            />
            <label htmlFor="cr-desc">Краткое описание</label>
            <textarea
              id="cr-desc"
              value={form.descriptionShort}
              onChange={(e) => setForm((f) => ({ ...f, descriptionShort: e.target.value }))}
              placeholder="Краткое описание"
              rows={2}
            />
            <label>Обложка</label>
            <div className="content-upload-row">
              <input type="file" accept="image/*" onChange={handleImage} disabled={uploadingImage} />
              {form.imageUrl && (
                <img src={getMediaUrl(form.imageUrl)} alt="" className="content-preview-img" />
              )}
              {uploadingImage && <span>Загрузка...</span>}
            </div>
            <label className="content-checkbox-label">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              />
              Опубликован
            </label>
          </div>
          <div className="course-tracks-block">
            <h4>Треки курса</h4>
            <button type="button" className="content-btn-secondary content-btn-small" onClick={addTrack}>
              + Добавить трек
            </button>
            {form.tracks.map((t, idx) => (
              <div key={idx} className="course-track-row">
                <input
                  value={t.title}
                  onChange={(e) => updateTrack(idx, 'title', e.target.value)}
                  placeholder="Название трека"
                  className="course-track-input"
                />
                <input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={(e) => handleTrackFile(idx, e)}
                  disabled={uploadingTrack}
                />
                {t.mediaUrl && <span className="content-file-name">Файл загружен</span>}
                <button type="button" className="content-btn-icon" onClick={() => removeTrack(idx)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="content-form-actions">
            <button type="button" className="add-btn add-btn-small" onClick={save} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            {editing && (
              <button type="button" className="content-btn-danger content-btn-small" onClick={() => remove(editing.id)}>
                Удалить
              </button>
            )}
            <button type="button" className="content-btn-secondary content-btn-small" onClick={closeForm}>
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="cards-row">
        {courses.length === 0 ? (
          <div className="empty-section empty-section-small">Нет курсов.</div>
        ) : (
          [...courses]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((c) => (
              <div key={c.id} className="card-tile">
                {c.imageUrl ? (
                  <img src={getMediaUrl(c.imageUrl)} alt="" className="card-tile-img" />
                ) : (
                  <div className="card-tile-img card-tile-placeholder" />
                )}
                <div className="card-tile-body">
                  <strong>{c.title}</strong>
                  <span className="content-meta">
                    {(c.courseTrackItems ?? []).length} треков
                  </span>
                </div>
                <button type="button" className="content-btn-small" onClick={() => openEdit(c)}>
                  Изменить
                </button>
              </div>
            ))
        )}
      </div>
    </section>
  )
}

function HomeSectionsBlock({
  sections,
  tracks,
  onReload,
}: {
  sections: ContentSection[]
  tracks: ContentTrack[]
  onReload: () => void
}) {
  return (
    <section className="main-block">
      <div className="main-block-header">
        <h2>Разделы главного экрана</h2>
      </div>
      <SplitSectionsTab type="HOME" typeLabel="Главная" sections={sections} tracks={tracks} onReload={onReload} />
    </section>
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
  const [sectionForm, setSectionForm] = useState({ name: '', slug: '', sortOrder: 0, cardType: 'TRACKS' as string })
  const [editingTrack, setEditingTrack] = useState<ContentTrack | null>(null)
  const [creatingTrack, setCreatingTrack] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [lastUploadSize, setLastUploadSize] = useState<number | null>(null)
  const [mediaTypeChoice, setMediaTypeChoice] = useState<'audio' | 'video' | null>(null)
  const [trackForm, setTrackForm] = useState<Partial<ContentTrack> & { sectionId: string; title: string }>({
    sectionId: '',
    title: '',
    descriptionShort: '',
    coverUrl: null,
    audioUrl: null,
    videoUrl: null,
    mediaType: 'AUDIO',
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
    setSectionForm({ name: s.name, slug: s.slug, sortOrder: s.sortOrder, cardType: s.cardType ?? 'TRACKS' })
  }
  const openCreateSection = () => {
    setEditingSection(null)
    setCreatingSection(true)
    setSectionForm({ name: '', slug: '', sortOrder: sections.length, cardType: 'TRACKS' })
  }
  const closeSectionForm = () => {
    setEditingSection(null)
    setCreatingSection(false)
  }

  const saveSection = async () => {
    setSaving(true)
    try {
      const body = { ...sectionForm, type }
      if (editingSection) {
        await api.content.sections.update(editingSection.id, body)
      } else {
        await api.content.sections.create(body)
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
    setMediaTypeChoice(null)
    setLastUploadSize(null)
    setTrackForm({
      sectionId: t.sectionId,
      title: t.title,
      descriptionShort: t.descriptionShort,
      coverUrl: t.coverUrl ?? null,
      audioUrl: t.audioUrl ?? null,
      videoUrl: t.videoUrl ?? null,
      mediaType: (t.mediaType as 'AUDIO' | 'VIDEO') ?? (t.videoUrl ? 'VIDEO' : 'AUDIO'),
      durationSeconds: t.durationSeconds ?? null,
      level: t.level ?? null,
      isPremium: t.isPremium,
      sortOrder: t.sortOrder,
    })
  }
  const openCreateTrack = () => {
    if (!selectedSectionId) {
      alert('Сначала выберите раздел')
      return
    }
    const sec = sections.find((s) => s.id === selectedSectionId)
    const cardType = sec?.cardType ?? 'TRACKS'
    setEditingTrack(null)
    setCreatingTrack(true)
    setMediaTypeChoice(cardType === 'VIDEO' ? 'video' : null)
    setLastUploadSize(null)
    setTrackForm({
      sectionId: selectedSectionId,
      title: '',
      descriptionShort: '',
      coverUrl: null,
      audioUrl: null,
      videoUrl: null,
      mediaType: cardType === 'VIDEO' ? 'VIDEO' : 'AUDIO',
      durationSeconds: null,
      level: null,
      isPremium: false,
      sortOrder: sectionTracks.length,
    })
  }
  const closeTrackForm = () => {
    setEditingTrack(null)
    setCreatingTrack(false)
    setMediaTypeChoice(null)
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
        videoUrl: null,
        mediaType: 'AUDIO',
        durationSeconds: result.durationSeconds ?? f.durationSeconds ?? null,
      }))
      setLastUploadSize(result.size ?? null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка загрузки аудио')
    } finally {
      setUploadingAudio(false)
    }
  }

  const handleVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 300 * 1024 * 1024) {
      alert('Видео не должно превышать 300 МБ')
      return
    }
    const ext = file.name.toLowerCase().split('.').pop()
    if (!['mp4', 'webm', 'm4v'].includes(ext || '')) {
      alert('Разрешены форматы: mp4, webm, m4v (для Android и iOS)')
      return
    }
    setUploadingVideo(true)
    try {
      const result = await api.content.upload.video(file)
      setTrackForm((f) => ({
        ...f,
        videoUrl: result.url,
        audioUrl: null,
        mediaType: 'VIDEO',
      }))
      setLastUploadSize(result.size ?? null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка загрузки видео')
    } finally {
      setUploadingVideo(false)
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
    if (trackForm.mediaType === 'VIDEO' && !trackForm.videoUrl) {
      alert('Загрузите видео')
      return
    }
    if (trackForm.mediaType === 'AUDIO' && !trackForm.audioUrl) {
      alert('Загрузите аудио')
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
              <label htmlFor="sec-name">Название</label>
              <input
                id="sec-name"
                value={sectionForm.name}
                onChange={(e) => setSectionForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Например: Утренний сон"
              />
              <label htmlFor="sec-slug">Slug</label>
              <input
                id="sec-slug"
                value={sectionForm.slug}
                onChange={(e) => setSectionForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="morning"
              />
              <label htmlFor="sec-order">Порядок</label>
              <input
                id="sec-order"
                type="number"
                value={sectionForm.sortOrder}
                onChange={(e) => setSectionForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
              />
              {type === 'HOME' && (
                <>
                  <label htmlFor="sec-cardType">Тип карточек</label>
                  <select
                    id="sec-cardType"
                    value={sectionForm.cardType}
                    onChange={(e) => setSectionForm((f) => ({ ...f, cardType: e.target.value }))}
                  >
                    <option value="STATIC">Статьи (как «О силе мышления»)</option>
                    <option value="TRACKS">Треки (аудио)</option>
                    <option value="VIDEO">Видео</option>
                  </select>
                </>
              )}
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
              Нет разделов. Нажмите «Добавить раздел» ниже.
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
        {type === 'HOME' && (
          <div className="split-add-section-footer">
            <button type="button" className="add-btn add-btn-small" onClick={openCreateSection}>
              + Добавить раздел
            </button>
          </div>
        )}
      </div>

      <div className="split-right">
        <div className="split-panel-header">
          <h2>Треки {selectedSection ? `— ${selectedSection.name}` : ''}</h2>
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
            {mediaTypeChoice === null && selectedSection?.cardType === 'TRACKS' && !editingTrack ? (
              <div className="content-media-choice">
                <p>Какой тип карточки добавляете?</p>
                <div className="content-choice-buttons">
                  <button
                    type="button"
                    className="add-btn add-btn-small"
                    onClick={() => {
                      setMediaTypeChoice('audio')
                      setTrackForm((f) => ({ ...f, mediaType: 'AUDIO' }))
                    }}
                  >
                    Аудио
                  </button>
                  <button
                    type="button"
                    className="add-btn add-btn-small"
                    onClick={() => {
                      setMediaTypeChoice('video')
                      setTrackForm((f) => ({ ...f, mediaType: 'VIDEO' }))
                    }}
                  >
                    Видео
                  </button>
                </div>
                <button type="button" className="content-btn-secondary content-btn-small" onClick={closeTrackForm}>
                  Отмена
                </button>
              </div>
            ) : (
            <>
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
              {trackForm.mediaType === 'VIDEO' ? (
                <>
                  <label>Видео (макс. 300 МБ, mp4, webm, m4v)</label>
                  <div className="content-upload-row">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/x-m4v,.mp4,.webm,.m4v"
                      onChange={handleVideo}
                      disabled={uploadingVideo}
                    />
                    {trackForm.videoUrl && <span className="content-file-name">Видео загружено</span>}
                    {lastUploadSize != null && (
                      <span className="content-file-size">Размер: {formatSize(lastUploadSize)}</span>
                    )}
                    {uploadingVideo && <span>Загрузка...</span>}
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
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
            </>
            )}
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
                        {t.level || '—'} · {t.mediaType === 'VIDEO' ? (t.videoUrl ? 'видео' : 'нет видео') : (t.audioUrl ? 'аудио' : 'нет аудио')}
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
