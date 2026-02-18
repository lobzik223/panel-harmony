import type { HomeCardsData, MeditationTrack, SleepTrack } from '../types'

export const defaultHomeCards: HomeCardsData = {
  featured: {
    id: 'featured1',
    image: '/placeholder-card.jpg',
    date: '5 декабря',
    title: 'Путь вдоха',
    subtitle: 'Китайская мудрость о долголетии',
    type: 'Занятие',
    duration: '8 мин',
    isLocked: false,
  },
  recommended: [
    { id: 'rec1', image: '/placeholder-card.jpg', title: 'Исполнение желаний', type: 'Курс', views: '12,3 тыс', isLocked: false },
    { id: 'rec2', image: '/placeholder-card.jpg', title: 'Колесо жизненного баланса', type: 'Курс', views: '26,3 тыс', isLocked: false },
  ],
  emergency: [
    { id: 'emergency1', image: '/placeholder-card.jpg', title: 'Снятие стресса', type: 'Медитация', duration: '5 мин', isLocked: false },
    { id: 'emergency2', image: '/placeholder-card.jpg', title: 'Быстрое успокоение', type: 'Дыхание', duration: '3 мин', isLocked: false },
  ],
}

export const defaultMeditationTracks: MeditationTrack[] = [
  { id: '1', title: 'Lorem ipsum dolor sit amet consectetur', description: 'i-медитация • Уровень В', level: 'В', image: '', video: '', type: 'meditation', category: 'relaxation', isPremium: false },
  { id: '2', title: 'Lorem ipsum dolor sit', description: 'i-медитация • Уровень А', level: 'А', image: '', video: '', type: 'meditation', category: 'relaxation', isPremium: true },
  { id: '5', title: 'Lorem ipsum dolor sit amet consectetur', description: 'i-медитация • Уровень В', level: 'В', image: '', video: '', type: 'meditation', category: 'inspiration', isPremium: false },
  { id: '9', title: 'Lorem ipsum dolor sit amet consectetur', description: 'i-медитация • Уровень В', level: 'В', image: '', video: '', type: 'meditation', category: 'love', isPremium: false },
]

export const defaultSleepTracks: SleepTrack[] = [
  { id: 'sleep1', title: 'Lorem ipsum dolor sit amet', description: '2:23:65', image: '', video: '', type: 'sleep', category: 'nightmare_exclusion', isPremium: false },
  { id: 'sleep5', title: 'Lorem ipsum dolor sit amet', description: '2:23:65', image: '', video: '', type: 'sleep', category: 'other_direction', isPremium: false },
]
