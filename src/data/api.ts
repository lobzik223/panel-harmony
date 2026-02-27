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

/** Возвращает полный URL для медиа (обложки, треки, картинки статей). */
export function getMediaUrl(path: string | null | undefined): string {
  if (!path) return ''
  return path.startsWith('http') ? path : `${API_BASE.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`
}

export interface HealthStats {
  serverOk: boolean
  dbOk: boolean
  totalActiveUsers?: number
  registrationsToday: number
  registrationsWeek: number
  registrationsMonth: number
  deletedAccounts: number
}

export interface ContentSection {
  id: string
  name: string
  slug: string
  type: string
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
  level: string | null
  isPremium: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  section?: ContentSection
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
  createdAt: string
  updatedAt: string
}

async function fetchStats(): Promise<HealthStats> {
  const url = `${API_BASE}${API_PREFIX}/health/stats`
  const res = await fetch(url, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error(`Stats: ${res.status}`)
  return res.json()
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = { ...getAuthHeaders(), ...(init?.headers as Record<string, string>) }
  if (init?.body && typeof init.body === 'string' && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
  const res = await fetch(url, { ...init, headers })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
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
      create: (body: { name: string; slug: string; type: string; sortOrder?: number }) =>
        fetchJson<ContentSection>(`${API_BASE}${API_PREFIX}/content/sections`, { method: 'POST', body: JSON.stringify(body) }),
      update: (id: string, body: Partial<{ name: string; slug: string; type: string; sortOrder: number }>) =>
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
    },
    articles: {
      get: (blockType?: string) =>
        fetchJson<ContentArticle[]>(
          `${API_BASE}${API_PREFIX}/content/articles${blockType ? `?blockType=${encodeURIComponent(blockType)}` : ''}`,
        ),
      getById: (id: string) => fetchJson<ContentArticle>(`${API_BASE}${API_PREFIX}/content/articles/${id}`),
      create: (body: { blockType: string; title: string; descriptionShort?: string; descriptionFull?: string; imageUrl?: string; sortOrder?: number }) =>
        fetchJson<ContentArticle>(`${API_BASE}${API_PREFIX}/content/articles`, { method: 'POST', body: JSON.stringify(body) }),
      update: (id: string, body: Partial<ContentArticle>) =>
        fetchJson<ContentArticle>(`${API_BASE}${API_PREFIX}/content/articles/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
      delete: (id: string) =>
        fetch(`${API_BASE}${API_PREFIX}/content/articles/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then((r) => { if (!r.ok) throw new Error(String(r.status)) }),
    },
    home: () => fetchJson<{ sections: ContentSection[]; home: { featured: ContentArticle | null; recommended: ContentArticle[]; emergency: ContentArticle[] } }>(`${API_BASE}${API_PREFIX}/content/home`),
    upload: {
      cover: async (file: File) => {
        const form = new FormData()
        form.append('file', file)
        const headers = getAuthHeaders()
        delete (headers as any)['Content-Type']
        const res = await fetch(`${API_BASE}${API_PREFIX}/content/upload/cover`, { method: 'POST', headers, body: form })
        if (!res.ok) throw new Error(await res.text())
        const data = (await res.json()) as { url: string }
        return data.url
      },
      track: async (file: File) => {
        const form = new FormData()
        form.append('file', file)
        const headers = getAuthHeaders()
        delete (headers as any)['Content-Type']
        const res = await fetch(`${API_BASE}${API_PREFIX}/content/upload/track`, { method: 'POST', headers, body: form })
        if (!res.ok) throw new Error(await res.text())
        const data = (await res.json()) as { url: string }
        return data.url
      },
      articleImage: async (file: File) => {
        const form = new FormData()
        form.append('file', file)
        const headers = getAuthHeaders()
        delete (headers as any)['Content-Type']
        const res = await fetch(`${API_BASE}${API_PREFIX}/content/upload/article-image`, { method: 'POST', headers, body: form })
        if (!res.ok) throw new Error(await res.text())
        const data = (await res.json()) as { url: string }
        return data.url
      },
    },
  },
}
