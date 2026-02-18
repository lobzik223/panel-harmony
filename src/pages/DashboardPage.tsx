import { useState, useEffect } from 'react'
import { api } from '../data/api'
import type { HomeCard, HomeCardsData } from '../types'
import CardPreview from '../components/CardPreview'
import CardEditor, { type CardEditFields } from '../components/CardEditor'
import './SectionPage.css'

export default function DashboardPage() {
  const [data, setData] = useState<HomeCardsData | null>(null)

  useEffect(() => {
    setData(api.homeCards.get())
  }, [])

  const save = (d: HomeCardsData) => {
    api.homeCards.save(d)
    setData(d)
  }

  const [editingCard, setEditingCard] = useState<{ type: 'featured' | 'recommended' | 'emergency'; index?: number } | null>(null)

  const getCard = (): Partial<CardEditFields> | null => {
    if (!data || !editingCard) return null
    if (editingCard.type === 'featured') {
      const c = data.featured
      return { title: c.title, subtitle: c.subtitle, type: c.type, date: c.date, duration: c.duration, image: c.image }
    }
    const arr = editingCard.type === 'recommended' ? data.recommended : data.emergency
    const c = arr[editingCard.index ?? 0]
    if (!c) return null
    return { title: c.title, subtitle: c.subtitle, type: c.type, duration: c.duration, views: c.views, image: c.image }
  }

  const handleSaveCard = (fields: CardEditFields) => {
    if (!data || !editingCard) return
    const copy = { ...data }
    if (editingCard.type === 'featured') {
      copy.featured = { ...copy.featured, ...fields }
    } else {
      const arr = [...(editingCard.type === 'recommended' ? copy.recommended : copy.emergency)]
      const idx = editingCard.index ?? 0
      arr[idx] = { ...arr[idx], ...fields }
      if (editingCard.type === 'recommended') copy.recommended = arr
      else copy.emergency = arr
    }
    save(copy)
    setEditingCard(null)
  }

  const handleDeleteCard = (type: 'recommended' | 'emergency', index: number) => {
    if (!data) return
    const copy = { ...data }
    const arr = type === 'recommended' ? [...copy.recommended] : [...copy.emergency]
    arr.splice(index, 1)
    if (type === 'recommended') copy.recommended = arr
    else copy.emergency = arr
    save(copy)
  }

  const handleAddCard = (type: 'recommended' | 'emergency') => {
    if (!data) return
    const copy = { ...data }
    const newCard: HomeCard = {
      id: `new_${Date.now()}`,
      image: '',
      title: 'Новая карточка',
      type: 'Курс',
      isLocked: false,
    }
    if (type === 'recommended') copy.recommended = [...copy.recommended, newCard]
    else copy.emergency = [...copy.emergency, newCard]
    save(copy)
  }

  if (!data) return <div className="page-loading">Загрузка...</div>

  return (
    <div className="section-page">
      <header className="page-header">
        <h1>Главная страница</h1>
        <p>Управление карточками главного экрана приложения</p>
      </header>

      <section className="card-section">
        <h2>Главная карточка (Featured)</h2>
        <CardPreview
          title={data.featured.title}
          subtitle={data.featured.subtitle}
          type={data.featured.type}
          image={data.featured.image}
          variant="home"
          onEdit={() => setEditingCard({ type: 'featured' })}
          onDelete={() => {}}
        />
      </section>

      <section className="card-section">
        <div className="section-title-row">
          <h2>Сила мыслей (Recommended)</h2>
          <button className="add-btn" onClick={() => handleAddCard('recommended')}>+ Добавить</button>
        </div>
        <div className="cards-grid">
          {data.recommended.map((card, i) => (
            <CardPreview
              key={card.id}
              title={card.title}
              subtitle={card.views}
              type={card.type}
              image={card.image}
              variant="home"
              onEdit={() => setEditingCard({ type: 'recommended', index: i })}
              onDelete={() => handleDeleteCard('recommended', i)}
            />
          ))}
        </div>
      </section>

      <section className="card-section">
        <div className="section-title-row">
          <h2>Популярное от Harmony (Emergency)</h2>
          <button className="add-btn" onClick={() => handleAddCard('emergency')}>+ Добавить</button>
        </div>
        <div className="cards-grid">
          {data.emergency.map((card, i) => (
            <CardPreview
              key={card.id}
              title={card.title}
              subtitle={card.duration}
              type={card.type}
              image={card.image}
              variant="home"
              onEdit={() => setEditingCard({ type: 'emergency', index: i })}
              onDelete={() => handleDeleteCard('emergency', i)}
            />
          ))}
        </div>
      </section>

      <CardEditor
        open={!!editingCard}
        onClose={() => setEditingCard(null)}
        onSave={handleSaveCard}
        initial={getCard() ?? {}}
      />
    </div>
  )
}
