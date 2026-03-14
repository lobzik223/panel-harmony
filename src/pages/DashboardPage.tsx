import { useEffect, useState } from 'react'
import { Image as ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  api,
  getMediaUrl,
  type ContentArticle,
  type ContentCourse,
  type ContentSection,
  type ContentTrack,
} from '../data/api'
import './SectionPage.css'

const SECTION_TITLE = 'О силе мышления'
const BLOCK_TYPE = 'RECOMMENDED'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function CardCover({ imageUrl }: { imageUrl: string | null | undefined }) {
  const url = imageUrl?.trim()
  const [failed, setFailed] = useState(false)
  if (!url || failed) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0' }}>
        <ImageIcon size={24} color="#94a3b8" />
      </div>
    )
  }
  return (
    <img
      src={getMediaUrl(url)}
      alt=""
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      onError={() => setFailed(true)}
    />
  )
}

export default function DashboardPage() {
  const [cards, setCards] = useState<ContentArticle[]>([])
  const [popularTracks, setPopularTracks] = useState<ContentTrack[]>([])
  const [homeSections, setHomeSections] = useState<ContentSection[]>([])
  const [meditationSections, setMeditationSections] = useState<ContentSection[]>([])
  const [sleepSections, setSleepSections] = useState<ContentSection[]>([])
  const [courses, setCourses] = useState<ContentCourse[]>([])
  const [allTracks, setAllTracks] = useState<ContentTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [articleFormOpen, setArticleFormOpen] = useState(false)
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null)
  const [savingArticle, setSavingArticle] = useState(false)
  const [articleForm, setArticleForm] = useState({
    title: '',
    descriptionShort: '',
    descriptionFull: '',
    imageUrl: '',
    publishedAt: '',
  })

  const [courseFormOpen, setCourseFormOpen] = useState(false)
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [savingCourse, setSavingCourse] = useState(false)
  const [uploadingTrackIdx, setUploadingTrackIdx] = useState<number | null>(null)
  const [courseForm, setCourseForm] = useState<{
    title: string
    descriptionShort: string
    descriptionFull: string
    imageUrl: string
    isPublished: boolean
    tracks: Array<{ title: string; descriptionShort: string; mediaUrl: string }>
  }>({
    title: '',
    descriptionShort: '',
    descriptionFull: '',
    imageUrl: '',
    isPublished: true,
    tracks: [],
  })

  const loadAll = () => {
    setLoading(true)
    Promise.all([
      api.content.articles.get(BLOCK_TYPE),
      api.content.tracks.popular(10),
      api.content.sections.get('HOME'),
      api.content.sections.get('MEDITATION'),
      api.content.sections.get('SLEEP'),
      api.content.courses.get(),
      api.content.tracks.get(),
    ])
      .then(([articles, popular, homeSectionsList, meditationList, sleepList, coursesList, tracks]) => {
        setCards(articles)
        setPopularTracks(popular)
        setHomeSections(homeSectionsList)
        setMeditationSections(meditationList)
        setSleepSections(sleepList)
        setCourses(coursesList)
        setAllTracks(tracks)
        setError(null)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }

  const meditationTracks = allTracks.filter((t) => t.section?.type === 'MEDITATION')
  const sleepTracks = allTracks.filter((t) => t.section?.type === 'SLEEP')

  useEffect(() => {
    loadAll()
  }, [])

  const openCreateArticle = () => {
    setEditingArticleId(null)
    setArticleForm({
      title: '',
      descriptionShort: '',
      descriptionFull: '',
      imageUrl: '',
      publishedAt: new Date().toISOString().slice(0, 10),
    })
    setArticleFormOpen(true)
  }

  const openEditArticle = (a: ContentArticle) => {
    setEditingArticleId(a.id)
    setArticleForm({
      title: a.title,
      descriptionShort: a.descriptionShort ?? '',
      descriptionFull: a.descriptionFull ?? '',
      imageUrl: a.imageUrl ?? '',
      publishedAt: a.publishedAt ? a.publishedAt.slice(0, 10) : '',
    })
    setArticleFormOpen(true)
  }

  const submitArticle = (e: React.FormEvent) => {
    e.preventDefault()
    if (!articleForm.title.trim()) return
    setSavingArticle(true)
    const payload = {
      blockType: BLOCK_TYPE,
      title: articleForm.title.trim(),
      descriptionShort: articleForm.descriptionShort.trim() || undefined,
      descriptionFull: articleForm.descriptionFull.trim() || undefined,
      imageUrl: articleForm.imageUrl.trim() || undefined,
      publishedAt: articleForm.publishedAt || undefined,
    }
    const promise = editingArticleId
      ? api.content.articles.update(editingArticleId, payload)
      : api.content.articles.create(payload)
    promise
      .then(() => {
        setArticleFormOpen(false)
        setEditingArticleId(null)
        loadAll()
      })
      .catch((err) => alert(err instanceof Error ? err.message : 'Ошибка сохранения'))
      .finally(() => setSavingArticle(false))
  }

  const deleteArticle = (id: string) => {
    if (!confirm('Удалить карточку?')) return
    api.content.articles.delete(id).then(loadAll).catch((err) => alert(err instanceof Error ? err.message : 'Ошибка удаления'))
  }

  const openCreateCourse = () => {
    setEditingCourseId(null)
    setCourseForm({
      title: '',
      descriptionShort: '',
      descriptionFull: '',
      imageUrl: '',
      isPublished: true,
      tracks: [],
    })
    setCourseFormOpen(true)
  }

  const openEditCourse = (c: ContentCourse) => {
    setEditingCourseId(c.id)
    setCourseForm({
      title: c.title,
      descriptionShort: c.descriptionShort ?? '',
      descriptionFull: c.descriptionFull ?? '',
      imageUrl: c.imageUrl ?? '',
      isPublished: c.isPublished,
      tracks: (c.courseTrackItems ?? []).map((t) => ({
        title: t.title,
        descriptionShort: t.descriptionShort ?? '',
        mediaUrl: t.mediaUrl,
      })),
    })
    setCourseFormOpen(true)
  }

  const addCourseTrack = () => {
    if (courseForm.tracks.length >= 10) {
      alert('Максимум 10 треков в курсе')
      return
    }
    setCourseForm((f) => ({
      ...f,
      tracks: [...f.tracks, { title: '', descriptionShort: '', mediaUrl: '' }],
    }))
  }

  const removeCourseTrack = (idx: number) => {
    setCourseForm((f) => ({
      ...f,
      tracks: f.tracks.filter((_, i) => i !== idx),
    }))
  }

  const updateCourseTrack = (idx: number, field: 'title' | 'descriptionShort' | 'mediaUrl', value: string) => {
    setCourseForm((f) => ({
      ...f,
      tracks: f.tracks.map((t, i) => (i === idx ? { ...t, [field]: value } : t)),
    }))
  }

  const handleCourseTrackFile = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const sizeMB = file.size / 1024 / 1024
    if (sizeMB > 200) {
      alert(`Файл слишком большой (${sizeMB.toFixed(1)} МБ). Максимум 200 МБ.`)
      return
    }
    const ext = file.name.toLowerCase().match(/\.(mp4|m4a|mp3|wav|ogg|webm)$/)?.[0]
    if (!ext) {
      alert('Разрешены только: .mp4, .m4a, .mp3, .wav, .ogg, .webm')
      return
    }
    setUploadingTrackIdx(idx)
    api.content.upload.courseTrack(file)
      .then(({ url }) => updateCourseTrack(idx, 'mediaUrl', url))
      .catch((err) => alert(err instanceof Error ? err.message : 'Ошибка загрузки'))
      .finally(() => setUploadingTrackIdx(null))
    e.target.value = ''
  }

  const submitCourse = (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseForm.title.trim()) return
    const validTracks = courseForm.tracks.filter((t) => t.mediaUrl && t.title.trim())
    if (validTracks.some((t) => !t.mediaUrl || !t.title.trim())) {
      alert('У каждого трека должны быть название и загруженный файл')
      return
    }
    setSavingCourse(true)
    const payload = {
      title: courseForm.title.trim(),
      descriptionShort: courseForm.descriptionShort.trim() || undefined,
      descriptionFull: courseForm.descriptionFull.trim() || undefined,
      imageUrl: courseForm.imageUrl.trim() || undefined,
      isPublished: courseForm.isPublished,
      tracks: validTracks.map((t) => ({
        title: t.title.trim(),
        descriptionShort: t.descriptionShort.trim() || undefined,
        mediaUrl: t.mediaUrl,
      })),
    }
    const promise = editingCourseId
      ? api.content.courses.update(editingCourseId, payload)
      : api.content.courses.create(payload)
    promise
      .then(() => {
        setCourseFormOpen(false)
        setEditingCourseId(null)
        loadAll()
      })
      .catch((err) => alert(err instanceof Error ? err.message : 'Ошибка сохранения курса'))
      .finally(() => setSavingCourse(false))
  }

  const deleteCourse = (id: string) => {
    if (!confirm('Удалить курс?')) return
    api.content.courses.delete(id).then(loadAll).catch((err) => alert(err instanceof Error ? err.message : 'Ошибка удаления курса'))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'article' | 'course') => {
    const file = e.target.files?.[0]
    if (!file) return
    api.content.upload.articleImage(file)
      .then((url) => {
        if (target === 'article') setArticleForm((f) => ({ ...f, imageUrl: url }))
        else setCourseForm((f) => ({ ...f, imageUrl: url }))
      })
      .catch((err) => alert(err instanceof Error ? err.message : 'Ошибка загрузки'))
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

      {error && <div className="page-error" style={{ marginBottom: 16 }}>{error}</div>}

      <section className="card-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>Раздел в приложении: «{SECTION_TITLE}»</h2>
          <button type="button" className="btn-primary" onClick={openCreateArticle}>
            <Plus size={18} /> Добавить карточку
          </button>
        </div>
        <p style={{ color: '#64748b', marginBottom: 16 }}>Эти карточки отображаются на главном экране приложения в разделе «{SECTION_TITLE}».</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cards.length === 0 ? (
            <div style={{ padding: 24, background: '#f8fafc', borderRadius: 12, color: '#64748b' }}>Карточек пока нет.</div>
          ) : cards.map((card) => (
            <div key={card.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <div style={{ width: 80, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                <CardCover imageUrl={card.imageUrl} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{card.title}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{card.publishedAt ? formatDate(card.publishedAt) : '—'}</div>
                {card.descriptionShort && <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{card.descriptionShort.slice(0, 80)}…</div>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => openEditArticle(card)}><Pencil size={16} /></button>
                <button type="button" className="btn-danger" onClick={() => deleteArticle(card.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>Раздел в приложении: Медитации</h2>
          <Link to="/content?tab=sections" className="btn-secondary" style={{ textDecoration: 'none', marginRight: 8 }}>Секции</Link>
          <Link to="/content?tab=tracks" className="btn-primary" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Plus size={18} /> Контент → Треки
          </Link>
        </div>
        <p style={{ color: '#64748b', marginBottom: 16 }}>
          Карточки с треками для окна «Медитации» в приложении (обложка, название, уровень; иконка медитации слева сверху). Создайте секцию типа «Медитации» во вкладке Контент → Секции, затем добавляйте треки во вкладке Контент → Треки.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {meditationSections.length === 0 ? (
            <div style={{ padding: 24, background: '#f8fafc', borderRadius: 12, color: '#64748b' }}>
              Нет секций типа «Медитации». Добавьте секцию во вкладке <Link to="/content?tab=sections">Контент → Секции</Link> (тип: Медитации).
            </div>
          ) : meditationSections.map((section) => (
            <div key={section.id} style={{ padding: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{section.name}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>slug: {section.slug} · треков: {section._count?.tracks ?? 0}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {meditationTracks.filter((t) => t.sectionId === section.id).length === 0 ? (
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>Треков пока нет</span>
                ) : meditationTracks.filter((t) => t.sectionId === section.id).map((track) => (
                  <div key={track.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: '#f8fafc', borderRadius: 8, minWidth: 200 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                      <CardCover imageUrl={track.coverUrl} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{track.title}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{track.level || '—'} {track.isPremium ? '· Премиум' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>Раздел в приложении: Сон</h2>
          <Link to="/content?tab=sections" className="btn-secondary" style={{ textDecoration: 'none', marginRight: 8 }}>Секции</Link>
          <Link to="/content?tab=tracks" className="btn-primary" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Plus size={18} /> Контент → Треки
          </Link>
        </div>
        <p style={{ color: '#64748b', marginBottom: 16 }}>
          Карточки с треками для окна «Сон» в приложении (обложка, название, уровень; иконка сна слева сверху). Создайте секцию типа «Сон» во вкладке Контент → Секции, затем добавляйте треки во вкладке Контент → Треки.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sleepSections.length === 0 ? (
            <div style={{ padding: 24, background: '#f8fafc', borderRadius: 12, color: '#64748b' }}>
              Нет секций типа «Сон». Добавьте секцию во вкладке <Link to="/content?tab=sections">Контент → Секции</Link> (тип: Сон).
            </div>
          ) : sleepSections.map((section) => (
            <div key={section.id} style={{ padding: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{section.name}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>slug: {section.slug} · треков: {section._count?.tracks ?? 0}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {sleepTracks.filter((t) => t.sectionId === section.id).length === 0 ? (
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>Треков пока нет</span>
                ) : sleepTracks.filter((t) => t.sectionId === section.id).map((track) => (
                  <div key={track.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: '#f8fafc', borderRadius: 8, minWidth: 200 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                      <CardCover imageUrl={track.coverUrl} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{track.title}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{track.level || '—'} {track.isPremium ? '· Премиум' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>Раздел в приложении: «Популярные от Harmony»</h2>
        </div>
        <p style={{ color: '#64748b', marginBottom: 16 }}>
          Только просмотр. Система автоматически показывает до 10 самых прослушиваемых треков.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {popularTracks.length === 0 ? (
            <div style={{ padding: 24, background: '#f8fafc', borderRadius: 12, color: '#64748b' }}>Пока нет прослушиваний.</div>
          ) : popularTracks.map((track, idx) => (
            <div key={track.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <div style={{ width: 80, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                <CardCover imageUrl={track.coverUrl} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>#{idx + 1} {track.title}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{track.descriptionShort || 'Без описания'}</div>
              </div>
              <div style={{ color: '#0f172a', fontWeight: 600, fontSize: 13 }}>
                {track.listenCount ?? 0} прослушиваний
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>Разделы главного экрана: Гармония, Расслабление, Осознанность, Энергия</h2>
          <Link to="/content?tab=tracks" className="btn-primary" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Plus size={18} /> Контент → Треки
          </Link>
        </div>
        <p style={{ color: '#64748b', marginBottom: 16 }}>
          Эти блоки показываются на главном экране приложения. Добавляйте треки в разделы во вкладке <strong>Контент → Треки</strong> (выберите раздел Гармония, Расслабление, Осознанность или Энергия).
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {homeSections.length === 0 ? (
            <div style={{ padding: 24, background: '#f8fafc', borderRadius: 12, color: '#64748b' }}>
              Разделы появятся после применения миграций на сервере. Пересоберите бэкенд (docker compose build и up).
            </div>
          ) : homeSections.map((section) => (
            <div key={section.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{section.name}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  Треков: {section._count?.tracks ?? 0}
                </div>
              </div>
              <Link to="/content?tab=tracks" className="btn-secondary" style={{ textDecoration: 'none' }}>
                Добавить треки
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="card-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>Раздел в приложении: «Курсы»</h2>
          <button type="button" className="btn-primary" onClick={openCreateCourse}>
            <Plus size={18} /> Добавить курс
          </button>
        </div>
        <p style={{ color: '#64748b', marginBottom: 16 }}>
          Загружайте треки для курса (mp4, m4a, mp3, wav, ogg, webm). Максимум 10 треков, до 200 МБ на файл.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {courses.length === 0 ? (
            <div style={{ padding: 24, background: '#f8fafc', borderRadius: 12, color: '#64748b' }}>Курсов пока нет.</div>
          ) : courses.map((course) => (
            <div key={course.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <div style={{ width: 100, height: 70, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                <CardCover imageUrl={course.imageUrl} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{course.title}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{course.descriptionShort || 'Без описания'}</div>
                <div style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>Треков в курсе: {course.courseTrackItems?.length ?? 0}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => openEditCourse(course)}><Pencil size={16} /></button>
                <button type="button" className="btn-danger" onClick={() => deleteCourse(course.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {articleFormOpen && (
        <div className="modal-overlay" onClick={() => setArticleFormOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 520, width: '92%', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>{editingArticleId ? 'Редактировать карточку' : 'Добавить карточку'}</h3>
            <form onSubmit={submitArticle}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Название</label>
                <input type="text" value={articleForm.title} onChange={(e) => setArticleForm((f) => ({ ...f, title: e.target.value }))} required style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Краткое описание</label>
                <textarea value={articleForm.descriptionShort} onChange={(e) => setArticleForm((f) => ({ ...f, descriptionShort: e.target.value }))} rows={2} style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Полное описание</label>
                <textarea value={articleForm.descriptionFull} onChange={(e) => setArticleForm((f) => ({ ...f, descriptionFull: e.target.value }))} rows={4} style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Обложка</label>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageUpload(e, 'article')} style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>JPG, PNG или WebP, до 1 МБ</p>
                {articleForm.imageUrl && (
                  <div style={{ marginTop: 8 }}>
                    <img src={getMediaUrl(articleForm.imageUrl)} alt="" style={{ maxWidth: 120, maxHeight: 80, objectFit: 'cover', borderRadius: 8 }} />
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Дата</label>
                <input type="date" value={articleForm.publishedAt} onChange={(e) => setArticleForm((f) => ({ ...f, publishedAt: e.target.value }))} style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setArticleFormOpen(false)}>Отмена</button>
                <button type="submit" className="btn-primary" disabled={savingArticle}>{savingArticle ? 'Сохранение…' : editingArticleId ? 'Сохранить' : 'Добавить'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {courseFormOpen && (
        <div className="modal-overlay" onClick={() => setCourseFormOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 560, width: '92%', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>{editingCourseId ? 'Редактировать курс' : 'Добавить курс'}</h3>
            <form onSubmit={submitCourse}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Название курса</label>
                <input type="text" value={courseForm.title} onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))} required style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Краткое описание</label>
                <textarea value={courseForm.descriptionShort} onChange={(e) => setCourseForm((f) => ({ ...f, descriptionShort: e.target.value }))} rows={2} style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Полное описание</label>
                <textarea value={courseForm.descriptionFull} onChange={(e) => setCourseForm((f) => ({ ...f, descriptionFull: e.target.value }))} rows={4} style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Обложка курса</label>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageUpload(e, 'course')} style={{ marginBottom: 8 }} />
                {courseForm.imageUrl && <img src={getMediaUrl(courseForm.imageUrl)} alt="" style={{ maxWidth: 120, maxHeight: 80, objectFit: 'cover', borderRadius: 8 }} />}
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Треки курса</label>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>mp4, m4a, mp3, wav, ogg, webm — до 200 МБ. Максимум 10 треков.</p>
                {courseForm.tracks.map((track, idx) => (
                  <div key={idx} style={{ marginBottom: 12, padding: 12, border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <strong>Трек {idx + 1}</strong>
                      <button type="button" className="btn-danger" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => removeCourseTrack(idx)}>Удалить</button>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <input type="text" placeholder="Название трека" value={track.title} onChange={(e) => updateCourseTrack(idx, 'title', e.target.value)} required style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }} />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <input type="text" placeholder="Краткое описание" value={track.descriptionShort} onChange={(e) => updateCourseTrack(idx, 'descriptionShort', e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }} />
                    </div>
                    <div>
                      <input type="file" accept=".mp4,.m4a,.mp3,.wav,.ogg,.webm" onChange={(e) => handleCourseTrackFile(idx, e)} style={{ marginBottom: 4 }} disabled={uploadingTrackIdx === idx} />
                      {uploadingTrackIdx === idx && <span style={{ fontSize: 12, color: '#64748b' }}> Загрузка…</span>}
                      {track.mediaUrl && <span style={{ fontSize: 12, color: '#22c55e' }}> ✓ Файл загружен</span>}
                    </div>
                  </div>
                ))}
                <button type="button" className="btn-secondary" onClick={addCourseTrack} disabled={courseForm.tracks.length >= 10} style={{ marginTop: 8 }}>
                  + Добавить трек
                </button>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>
                  <input type="checkbox" checked={courseForm.isPublished} onChange={(e) => setCourseForm((f) => ({ ...f, isPublished: e.target.checked }))} /> Опубликован
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setCourseFormOpen(false)}>Отмена</button>
                <button type="submit" className="btn-primary" disabled={savingCourse}>{savingCourse ? 'Сохранение…' : editingCourseId ? 'Сохранить' : 'Добавить'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
