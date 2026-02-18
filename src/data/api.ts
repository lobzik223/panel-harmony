import type { HomeCardsData, MeditationTrack, SleepTrack } from '../types'
import { defaultHomeCards, defaultMeditationTracks, defaultSleepTracks } from './mockData'

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
}
