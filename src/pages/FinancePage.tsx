import './SectionPage.css'

export default function FinancePage() {
  return (
    <div className="section-page">
      <header className="page-header">
        <h1>Финансы</h1>
        <p>Раздел «Финансы» — управление карточками. Добавьте контент по мере появления.</p>
      </header>
      <div className="empty-section">
        <p>Пока нет карточек. Раздел готов к наполнению.</p>
      </div>
    </div>
  )
}
