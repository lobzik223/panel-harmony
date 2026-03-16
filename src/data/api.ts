import { API_BASE, API_PREFIX, APP_KEY } from '../config'
const AUTH_TOKEN_KEY = 'harmony_admin_token'

/** Заголовки для запросов к API: токен админа + APP_KEY. Без входа в панели запросы не должны уходить. */
function getAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (APP_KEY) h['X-Harmony-App-Key'] = APP_KEY
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

function getStoredToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

function getJwtExp(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const parsed = JSON.parse(json) as { exp?: number }
    return typeof parsed.exp === 'number' ? parsed.exp : null
  } catch {
    return null
  }
}

function isTokenExpired(token: string): boolean {
  const exp = getJwtExp(token)
  if (!exp) return false
  const now = Math.floor(Date.now() / 1000)
  // Небольшой буфер, чтобы не отправлять заведомо истекший токен.
  return now >= exp - 5
}

function clearAuthToken(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

function unauthorizedMessage(): string {
  const token = getStoredToken()
  if (!APP_KEY) {
    return '401: Не задан VITE_APP_KEY в .env панели. Укажите APP_KEY бэкенда и пересоберите панель.'
  }
  if (!token) {
    return 'Сессия не найдена. Войдите в панель заново.'
  }
  if (isTokenExpired(token)) {
    clearAuthToken()
    return 'Сессия администратора истекла. Войдите в панель заново.'
  }
  return '401: Доступ запрещен. Проверьте APP_KEY на бэкенде и в панели, затем войдите заново.'
}

/** Возвращает полный URL для медиа (обложки, треки, картинки статей). */
export function getMediaUrl(path: string | null | undefined): string {
  if (!path) return ''
  return path.startsWith('http') ? path : `${API_BASE.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`
}

export interface DiskUsageItem {
  path: string
  label: string
  bytes: number
}

export interface HealthStats {
  serverOk: boolean
  dbOk: boolean
  totalActiveUsers?: number
  registrationsToday: number
  registrationsWeek: number
  registrationsMonth: number
  deletedAccounts: number
  diskUsage?: {
    folders: DiskUsageItem[]
    totalUploadsBytes: number
    diskTotalBytes?: number
    diskUsedBytes?: number
    diskAvailBytes?: number
  }
}

export interface ContentSection {
  id: string
  name: string
  slug: string
  type: string
  cardType?: string // STATIC | TRACKS | VIDEO
  sortOrder: number
  createdAt: string
  updatedAt: string
  tracks?: ContentTrack[]
  _count?: { tracks: number }
}

export interface ContentTrack {
  id: string
  sectionId: string
  title: string
  descriptionShort: string
  coverUrl: string | null
  audioUrl: string | null
  videoUrl?: string | null
  mediaType?: string // AUDIO | VIDEO
  durationSeconds?: number | null
  level: string | null
  isPremium: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  section?: ContentSection
  listenCount?: number
}

export interface ContentArticle {
  id: string
  blockType: string
  title: string
  descriptionShort: string
  descriptionFull: string | null
  imageUrl: string | null
  sortOrder: number
  publishedAt: string | null
  durationMinutes: number | null
  isPremium: boolean
  createdAt: string
  updatedAt: string
}

export interface ContentCourseTrackItem {
  id: string
  courseId: string
  title: string
  descriptionShort: string
  mediaUrl: string
  sortOrder: number
  createdAt: string
}

export interface ContentCourse {
  id: string
  title: string
  descriptionShort: string
  descriptionFull: string | null
  imageUrl: string | null
  sortOrder: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
  courseTrackItems: ContentCourseTrackItem[]
}

function apiErrorMessage(res: Response, body?: string): string {
  if (res.status === 401) {
    return unauthorizedMessage()
  }
  return body || `Ошибка ${res.status}`
}

async function fetchStats(): Promise<HealthStats> {
  const url = `${API_BASE}${API_PREFIX}/health/stats`
  const res = await fetch(url, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error(apiErrorMessage(res, `Stats: ${res.status}`))
  return res.json()
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken()
  if (token && isTokenExpired(token)) {
    clearAuthToken()
    throw new Error('Сессия администратора истекла. Войдите в панель заново.')
  }
  const headers = { ...getAuthHeaders(), ...(init?.headers as Record<string, string>) }
  if (init?.body && typeof init.body === 'string' && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
  const res = await fetch(url, { ...init, headers })
  const text = await res.text()
  if (!res.ok) throw new Error(apiErrorMessage(res, text || undefined))
  return text ? JSON.parse(text) : (null as T)
}

export const api = {
  stats: {
    get: fetchStats,
  },
  content: {
    sections: {
      get: (type?: string) =>
        fetchJson<ContentSection[]>(
          `${API_BASE}${API_PREFIX}/content/sections${type ? `?type=${encodeURIComponent(type)}` : ''}`,
        ),
      getById: (id: string) => fetchJson<ContentSection>(`${API_BASE}${API_PREFIX}/content/sections/${id}`),
      create: (body: { name: string; slug: string; type: string; cardType?: string; sortOrder?: number }) =>
        fetchJson<ContentSection>(`${API_BASE}${API_PREFIX}/content/sections`, { method: 'POST', body: JSON.stringify(body) }),
      update: (id: string, body: Partial<{ name: string; slug: string; type: string; cardType: string; sortOrder: number }>) =>
        fetchJson<ContentSection>(`${API_BASE}${API_PREFIX}/content/sections/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
      delete: (id: string) =>
        fetch(`${API_BASE}${API_PREFIX}/content/sections/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then((r) => { if (!r.ok) throw new Error(String(r.status)) }),
    },
    tracks: {
      get: (sectionId?: string, type?: string) => {
        const params = new URLSearchParams()
        if (sectionId) params.set('sectionId', sectionId)
        if (type) params.set('type', type)
        return fetchJson<ContentTrack[]>(`${API_BASE}${API_PREFIX}/content/tracks?${params}`)
      },
      getById: (id: string) => fetchJson<ContentTrack>(`${API_BASE}${API_PREFIX}/content/tracks/${id}`),
      create: (body: Partial<ContentTrack> & { sectionId: string; title: string }) =>
        fetchJson<ContentTrack>(`${API_BASE}${API_PREFIX}/content/tracks`, { method: 'POST', body: JSON.stringify(body) }),
      update: (id: string, body: Partial<ContentTrack>) =>
        fetchJson<ContentTrack>(`${API_BASE}${API_PREFIX}/content/tracks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
      delete: (id: string) =>
        fetch(`${API_BASE}${API_PREFIX}/content/tracks/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then((r) => { if (!r.ok) throw new Error(String(r.status)) }),
      popular: (limit = 10) =>
        fetchJson<ContentTrack[]>(`${API_BASE}${API_PREFIX}/content/popular-tracks?limit=${encodeURIComponent(String(limit))}`),
    },
    articles: {
      get: (blockType?: string) =>
        fetchJson<ContentArticle[]>(
          `${API_BASE}${API_PREFIX}/content/articles${blockType ? `?blockType=${encodeURIComponent(blockType)}` : ''}`,
        ),
      getById: (id: string) => fetchJson<ContentArticle>(`${API_BASE}${API_PREFIX}/content/articles/${id}`),
      create: (body: { blockType: string; title: string; descriptionShort?: string; descriptionFull?: string; imageUrl?: string; sortOrder?: number; publishedAt?: string; durationMinutes?: number; isPremium?: boolean }) =>
        fetchJson<ContentArticle>(`${API_BASE}${API_PREFIX}/content/articles`, { method: 'POST', body: JSON.stringify(body) }),
      update: (id: string, body: Partial<ContentArticle>) =>
        fetchJson<ContentArticle>(`${API_BASE}${API_PREFIX}/content/articles/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
      delete: (id: string) =>
        fetch(`${API_BASE}${API_PREFIX}/content/articles/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then((r) => { if (!r.ok) throw new Error(String(r.status)) }),
    },
    courses: {
      get: (published?: boolean) =>
        fetchJson<ContentCourse[]>(
          `${API_BASE}${API_PREFIX}/content/courses${published !== undefined ? `?published=${published ? '1' : '0'}` : ''}`,
        ),
      getById: (id: string) => fetchJson<ContentCourse>(`${API_BASE}${API_PREFIX}/content/courses/${id}`),
      create: (body: { title: string; descriptionShort?: string; descriptionFull?: string; imageUrl?: string; sortOrder?: number; isPublished?: boolean; tracks?: Array<{ title: string; descriptionShort?: string; mediaUrl: string }> }) =>
        fetchJson<ContentCourse>(`${API_BASE}${API_PREFIX}/content/courses`, { method: 'POST', body: JSON.stringify(body) }),
      update: (id: string, body: Partial<{ title: string; descriptionShort: string; descriptionFull: string; imageUrl: string; sortOrder: number; isPublished: boolean; tracks: Array<{ title: string; descriptionShort?: string; mediaUrl: string }> }>) =>
        fetchJson<ContentCourse>(`${API_BASE}${API_PREFIX}/content/courses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
      delete: (id: string) =>
        fetch(`${API_BASE}${API_PREFIX}/content/courses/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then((r) => { if (!r.ok) throw new Error(String(r.status)) }),
    },
    home: () => fetchJson<{ sections: ContentSection[]; home: { featured: ContentArticle | null; recommended: ContentArticle[]; emergency: ContentArticle[] } }>(`${API_BASE}${API_PREFIX}/content/home`),
    upload: {
      cover: async (file: File) => {
        const form = new FormData()
        form.append('file', file)
        const headers = getAuthHeaders()
        delete (headers as any)['Content-Type']
        const res = await fetch(`${API_BASE}${API_PREFIX}/content/upload/cover`, { method: 'POST', headers, body: form })
        if (!res.ok) throw new Error(apiErrorMessage(res, await res.text()))
        const data = (await res.json()) as { url: string }
        return data.url
      },
      track: async (file: File): Promise<{ url: string; size?: number; durationSeconds?: number }> => {
        const form = new FormData()
        form.append('file', file)
        const headers = getAuthHeaders()
        delete (headers as any)['Content-Type']
        const res = await fetch(`${API_BASE}${API_PREFIX}/content/upload/track`, { method: 'POST', headers, body: form })
        if (!res.ok) throw new Error(apiErrorMessage(res, await res.text()))
        const data = (await res.json()) as { url: string; size?: number; durationSeconds?: number }
        return { url: data.url, size: data.size, durationSeconds: data.durationSeconds }
      },
      articleImage: async (file: File) => {
        const form = new FormData()
        form.append('file', file)
        const headers = getAuthHeaders()
        delete (headers as any)['Content-Type']
        const res = await fetch(`${API_BASE}${API_PREFIX}/content/upload/article-image`, { method: 'POST', headers, body: form })
        if (!res.ok) throw new Error(apiErrorMessage(res, await res.text()))
        const data = (await res.json()) as { url: string }
        return data.url
      },
      video: async (file: File): Promise<{ url: string; size?: number }> => {
        const form = new FormData()
        form.append('file', file)
        const headers = getAuthHeaders()
        delete (headers as any)['Content-Type']
        const res = await fetch(`${API_BASE}${API_PREFIX}/content/upload/video`, { method: 'POST', headers, body: form })
        if (!res.ok) throw new Error(apiErrorMessage(res, await res.text()))
        const data = (await res.json()) as { url: string; size?: number }
        return { url: data.url, size: data.size }
      },
      courseTrack: async (file: File): Promise<{ url: string; size?: number }> => {
        const form = new FormData()
        form.append('file', file)
        const headers = getAuthHeaders()
        delete (headers as any)['Content-Type']
        const res = await fetch(`${API_BASE}${API_PREFIX}/content/upload/course-track`, { method: 'POST', headers, body: form })
        if (!res.ok) throw new Error(apiErrorMessage(res, await res.text()))
        const data = (await res.json()) as { url: string; size?: number }
        return { url: data.url, size: data.size }
      },
    },
  },
}
