import { useState, useEffect } from 'react'
import { api } from '../data/api'
import type { SleepTrack } from '../types'
import CardPreview from '../components/CardPreview'
import CardEditor, { type CardEditFields } from '../components/CardEditor'
import './SectionPage.css'

const CATEGORIES = ['nightmare_exclusion', 'other_direction']
const CAT_LABELS: Record<string, string> = { nightmare_exclusion: 'Избавление от кошмаров', other_direction: 'Другое направление' }

export default function SleepPage() {
  const [tracks, setTracks] = useState<SleepTrack[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    setTracks(api.sleep.get())
  }, [])

  const save = (t: SleepTrack[]) => {
    api.sleep.save(t)
    setTracks(t)
  }

  const editTrack = tracks.find((t) => t.id === editingId)

  const handleSave = (fields: CardEditFields) => {
    const idx = tracks.findIndex((t) => t.id === editingId)
    if (idx < 0) return
    const copy = [...tracks]
    copy[idx] = {
      ...copy[idx],
      title: fields.title,
      description: fields.description ?? copy[idx].description,
      type: 'sleep',
      category: fields.category ?? copy[idx].category,
      image: fields.image ?? copy[idx].image,
      video: fields.video ?? copy[idx].video,
      isPremium: fields.isPremium ?? copy[idx].isPremium,
    }
    save(copy)
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    save(tracks.filter((t) => t.id !== id))
  }

  const handleAdd = () => {
    const newTrack: SleepTrack = {
      id: `sleep_${Date.now()}`,
      title: 'Новая карточка сна',
      description: '0:00',
      image: '',
      video: '',
      type: 'sleep',
      category: 'nightmare_exclusion',
      isPremium: false,
    }
    save([...tracks, newTrack])
    setEditingId(newTrack.id)
  }

  const byCategory = CATEGORIES.map((cat) => ({
    cat,
    label: CAT_LABELS[cat],
    items: tracks.filter((t) => t.category === cat),
  }))

  return (
    <div className="section-page">
      <header className="page-header">
        <h1>Сон</h1>
        <p>Управление карточками раздела Сон</p>
        <button className="add-btn" style={{ marginTop: 16 }} onClick={handleAdd}>+ Добавить карточку</button>
      </header>

      {byCategory.map(({ cat, label, items }) => (
        <section key={cat} className="card-section">
          <h2>{label}</h2>
          <div className="cards-grid">
            {items.map((t) => (
              <CardPreview
                key={t.id}
                title={t.title}
                subtitle={t.description}
                type={t.type}
                image={t.image}
                variant="sleep"
                onEdit={() => setEditingId(t.id)}
                onDelete={() => handleDelete(t.id)}
              />
            ))}
          </div>
        </section>
      ))}

      <CardEditor
        open={!!editTrack}
        onClose={() => setEditingId(null)}
        onSave={handleSave}
        initial={editTrack ? { title: editTrack.title, description: editTrack.description, category: editTrack.category, image: editTrack.image, video: editTrack.video, isPremium: editTrack.isPremium } : {}}
        categories={CATEGORIES}
      />
    </div>
  )
}
