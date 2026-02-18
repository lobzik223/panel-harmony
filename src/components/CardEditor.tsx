import { useState, useEffect } from 'react'
import './CardEditor.css'

export interface CardEditFields {
  title: string
  subtitle?: string
  type: string
  description?: string
  image?: string
  video?: string
  duration?: string
  views?: string
  date?: string
  isPremium?: boolean
  category?: string
}

interface CardEditorProps {
  open: boolean
  onClose: () => void
  onSave: (fields: CardEditFields) => void
  initial: Partial<CardEditFields>
  categories?: string[]
}

export default function CardEditor({ open, onClose, onSave, initial, categories = [] }: CardEditorProps) {
  const [fields, setFields] = useState<CardEditFields>({
    title: '',
    type: '',
    ...initial,
  })

  useEffect(() => {
    setFields({ title: '', type: '', ...initial })
  }, [initial, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(fields)
    onClose()
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Редактировать карточку</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <label>Название</label>
            <input
              value={fields.title}
              onChange={(e) => setFields((f) => ({ ...f, title: e.target.value }))}
              required
              placeholder="Название карточки"
            />
          </div>
          <div className="form-row">
            <label>Подзаголовок</label>
            <input
              value={fields.subtitle ?? ''}
              onChange={(e) => setFields((f) => ({ ...f, subtitle: e.target.value }))}
              placeholder="Описание"
            />
          </div>
          <div className="form-row">
            <label>Тип / Роль</label>
            <input
              value={fields.type}
              onChange={(e) => setFields((f) => ({ ...f, type: e.target.value }))}
              placeholder="Курс, Медитация, Занятие..."
            />
          </div>
          {categories.length > 0 && (
            <div className="form-row">
              <label>Категория раздела</label>
              <select
                value={fields.category ?? ''}
                onChange={(e) => setFields((f) => ({ ...f, category: e.target.value }))}
              >
                <option value="">— Выберите —</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-row">
            <label>Изображение (URL)</label>
            <input
              value={fields.image ?? ''}
              onChange={(e) => setFields((f) => ({ ...f, image: e.target.value }))}
              placeholder="assets/images/..."
            />
          </div>
          <div className="form-row">
            <label>Видео (URL)</label>
            <input
              value={fields.video ?? ''}
              onChange={(e) => setFields((f) => ({ ...f, video: e.target.value }))}
              placeholder="URL видео"
            />
          </div>
          <div className="form-row inline">
            <div>
              <label>Длительность</label>
              <input
                value={fields.duration ?? ''}
                onChange={(e) => setFields((f) => ({ ...f, duration: e.target.value }))}
                placeholder="8 мин"
              />
            </div>
            <div>
              <label>Просмотры</label>
              <input
                value={fields.views ?? ''}
                onChange={(e) => setFields((f) => ({ ...f, views: e.target.value }))}
                placeholder="12,3 тыс"
              />
            </div>
          </div>
          <div className="form-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={fields.isPremium ?? false}
                onChange={(e) => setFields((f) => ({ ...f, isPremium: e.target.checked }))}
              />
              Premium
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">Отмена</button>
            <button type="submit" className="btn-primary">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  )
}
