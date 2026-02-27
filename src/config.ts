/**
 * Базовый URL API. Задаётся при сборке через VITE_API_URL.
 * Если при сборке не задан — на домене панели используется продакшен-API,
 * иначе localhost (для разработки).
 */
function getApiBase(): string {
  const fromEnv = (import.meta as any).env?.VITE_API_URL
  if (fromEnv && fromEnv.trim() !== '') {
    return fromEnv.replace(/\/$/, '')
  }
  // Runtime fallback: если открыто с продакшен-панели — стучимся в продакшен-бекенд
  if (typeof window !== 'undefined' && window.location.hostname === 'panel.harmonymeditation.online') {
    return 'https://api.harmonymeditation.online'
  }
  return 'http://localhost:3000'
}

export const API_BASE = getApiBase()
export const API_PREFIX = '/api'
export const APP_KEY = ((import.meta as any).env?.VITE_APP_KEY ?? '').trim()
