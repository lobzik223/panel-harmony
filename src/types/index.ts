export interface HomeCard {
  id: string
  image: string
  title: string
  subtitle?: string
  type: string
  date?: string
  duration?: string
  views?: string
  isLocked?: boolean
}

export interface HomeCardsData {
  featured: HomeCard
  recommended: HomeCard[]
  emergency: HomeCard[]
}

export interface MeditationTrack {
  id: string
  title: string
  description: string
  level?: string
  image: string
  video: string
  type: string
  category: 'relaxation' | 'inspiration' | 'love'
  isPremium: boolean
  isPlaying?: boolean
}

export interface SleepTrack {
  id: string
  title: string
  description: string
  level?: string
  image: string
  video: string
  type: string
  category: string
  isPremium: boolean
  isPlaying?: boolean
}
