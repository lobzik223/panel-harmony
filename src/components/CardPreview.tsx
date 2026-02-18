import { useState } from 'react'
import './CardPreview.css'

interface CardPreviewProps {
  title: string
  subtitle?: string
  type?: string
  image?: string
  onEdit: () => void
  onDelete: () => void
  variant?: 'harmony' | 'sleep' | 'home'
}

export default function CardPreview({ title, subtitle, type, image, onEdit, onDelete, variant = 'harmony' }: CardPreviewProps) {
  const [imgError, setImgError] = useState(false)
  const imgSrc = image && !imgError ? (image.startsWith('http') || image.startsWith('/') ? image : `/${image}`) : ''
  const showPlaceholder = !imgSrc
  return (
    <div className="card-preview-app">
      <div className="card-preview-app-image">
        {imgSrc ? (
          <img src={imgSrc} alt="" onError={() => setImgError(true)} />
        ) : null}
        {showPlaceholder && <div className="card-preview-app-placeholder show">🖼</div>}
        <div className="card-preview-app-gradient" />
        <div className="card-preview-app-badge">
          {variant === 'sleep' ? '🌙' : variant === 'harmony' ? '🧘' : '▶'}
        </div>
        <div className="card-preview-app-play">▶</div>
        <div className="card-preview-app-actions">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Редактировать">✎</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Удалить" className="delete">×</button>
        </div>
      </div>
      <div className="card-preview-app-body">
        <h4>{title}</h4>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  )
}
