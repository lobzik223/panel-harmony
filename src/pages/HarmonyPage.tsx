import { useState, useEffect } from 'react'
import { api } from '../data/api'
import type { MeditationTrack } from '../types'
import CardPreview from '../components/CardPreview'
import CardEditor, { type CardEditFields } from '../components/CardEditor'
import './SectionPage.css'

const CATEGORIES = ['relaxation', 'inspiration', 'love']
const CAT_LABELS: Record<string, string> = { relaxation: 'Отдых', inspiration: 'Вдохновение', love: 'Любовь' }

export default function HarmonyPage() {
  const [tracks, setTracks] = useState<MeditationTrack[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    setTracks(api.meditation.get())
  }, [])

  const save = (t: MeditationTrack[]) => {
    api.meditation.save(t)
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
      type: fields.type || 'meditation',
      category: (fields.category as MeditationTrack['category']) ?? copy[idx].category,
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
    const newTrack: MeditationTrack = {
      id: `m_${Date.now()}`,
      title: 'Новая медитация',
      description: 'Описание',
      image: '',
      video: '',
      type: 'meditation',
      category: 'relaxation',
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
        <h1>Гармония</h1>
        <p>Управление карточками медитаций и контентом раздела Гармония</p>
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
        initial={editTrack ? { title: editTrack.title, description: editTrack.description, type: editTrack.type, category: editTrack.category, image: editTrack.image, video: editTrack.video, isPremium: editTrack.isPremium } : {}}
        categories={CATEGORIES}
      />
    </div>
  )
}
