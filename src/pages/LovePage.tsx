import { useState, useEffect } from 'react'
import { api } from '../data/api'
import type { MeditationTrack } from '../types'
import CardPreview from '../components/CardPreview'
import CardEditor, { type CardEditFields } from '../components/CardEditor'
import './SectionPage.css'

export default function LovePage() {
  const [tracks, setTracks] = useState<MeditationTrack[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    setTracks(api.meditation.get().filter((t) => t.category === 'love'))
  }, [])

  const loveTracks = tracks
  const save = (items: MeditationTrack[]) => {
    const all = api.meditation.get()
    const others = all.filter((t) => t.category !== 'love')
    api.meditation.save([...others, ...items])
    setTracks(items)
  }

  const editTrack = loveTracks.find((t) => t.id === editingId)

  const handleSave = (fields: CardEditFields) => {
    const idx = loveTracks.findIndex((t) => t.id === editingId)
    if (idx < 0) return
    const copy = [...loveTracks]
    copy[idx] = {
      ...copy[idx],
      title: fields.title,
      description: fields.description ?? copy[idx].description,
      category: 'love',
      image: fields.image ?? copy[idx].image,
      video: fields.video ?? copy[idx].video,
      isPremium: fields.isPremium ?? copy[idx].isPremium,
    }
    save(copy)
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    save(loveTracks.filter((t) => t.id !== id))
  }

  const handleAdd = () => {
    const newTrack: MeditationTrack = {
      id: `love_${Date.now()}`,
      title: 'Новая карточка',
      description: 'Описание',
      image: '',
      video: '',
      type: 'meditation',
      category: 'love',
      isPremium: false,
    }
    save([...loveTracks, newTrack])
    setEditingId(newTrack.id)
  }

  return (
    <div className="section-page">
      <header className="page-header">
        <h1>Любовь</h1>
        <p>Управление карточками раздела Любовь</p>
        <button className="add-btn" style={{ marginTop: 16 }} onClick={handleAdd}>+ Добавить карточку</button>
      </header>

      <section className="card-section">
        <div className="cards-grid">
          {loveTracks.map((t) => (
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

      <CardEditor
        open={!!editTrack}
        onClose={() => setEditingId(null)}
        onSave={handleSave}
        initial={editTrack ? { title: editTrack.title, description: editTrack.description, image: editTrack.image, video: editTrack.video, isPremium: editTrack.isPremium } : {}}
      />
    </div>
  )
}
