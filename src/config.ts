const PRODUCTION_PANEL_HOST = 'panel.harmonymeditation.online'
const PRODUCTION_API_BASE = 'https://api.harmonymeditation.online'

/**
 * Базовый URL API. При открытии с продакшен-панели всегда используется
 * продакшен-бекенд (чтобы не зависеть от того, что было подставлено при сборке).
 */
function getApiBase(): string {
  if (typeof window !== 'undefined' && window.location.hostname === PRODUCTION_PANEL_HOST) {
    return PRODUCTION_API_BASE
  }
  const fromEnv = (import.meta as any).env?.VITE_API_URL
  if (fromEnv && fromEnv.trim() !== '') {
    return fromEnv.replace(/\/$/, '')
  }
  return 'http://localhost:3000'
}

export const API_BASE = getApiBase()
export const API_PREFIX = '/api'
export const APP_KEY = ((import.meta as any).env?.VITE_APP_KEY ?? '').trim()
