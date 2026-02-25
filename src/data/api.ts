import type { HomeCardsData, MeditationTrack, SleepTrack } from '../types'
import { defaultHomeCards, defaultMeditationTracks, defaultSleepTracks } from './mockData'

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3000'
const API_PREFIX = '/api'
const APP_KEY = (import.meta as any).env?.VITE_APP_KEY ?? ''

export interface HealthStats {
  serverOk: boolean
  dbOk: boolean
  registrationsToday: number
  registrationsWeek: number
  registrationsMonth: number
  deletedAccounts: number
}

async function fetchStats(): Promise<HealthStats> {
  const url = `${API_BASE}${API_PREFIX}/health/stats`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (APP_KEY) headers['X-Harmony-App-Key'] = APP_KEY
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`Stats: ${res.status}`)
  return res.json()
}

const STORAGE_KEYS = {
  home: 'harmony_admin_home_cards',
  meditation: 'harmony_admin_meditation',
  sleep: 'harmony_admin_sleep',
}

function loadJson<T>(key: string, defaultData: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch (_) {}
  return defaultData
}

function saveJson<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data))
}

export const api = {
  homeCards: {
    get: () => loadJson<HomeCardsData>(STORAGE_KEYS.home, defaultHomeCards),
    save: (data: HomeCardsData) => saveJson(STORAGE_KEYS.home, data),
  },
  meditation: {
    get: () => loadJson<MeditationTrack[]>(STORAGE_KEYS.meditation, defaultMeditationTracks),
    save: (data: MeditationTrack[]) => saveJson(STORAGE_KEYS.meditation, data),
  },
  sleep: {
    get: () => loadJson<SleepTrack[]>(STORAGE_KEYS.sleep, defaultSleepTracks),
    save: (data: SleepTrack[]) => saveJson(STORAGE_KEYS.sleep, data),
  },
  stats: {
    get: fetchStats,
  },
}
