import KpiCard from './KpiCard'
import './Kpi.css'

type Metrics = {
  operationalHealth?: string
  healthLabel?: string
  issuesFound?: string
  rowsProcessed?: string
  columns?: string
}

function healthStatusClass(label?: string): string {
  if (!label) return ''
  if (label === 'Excellent' || label === 'Good') return 'kpi-card--healthy'
  if (label === 'Fair') return 'kpi-card--fair'
  return 'kpi-card--critical'
}

export default function KpiGrid({ metrics }: { metrics?: Metrics }) {
  const defaults: Metrics = {
    operationalHealth: '92%',
    issuesFound: '6',
    rowsProcessed: '12,431',
    columns: '14'
  }

  const m = { ...defaults, ...(metrics || {}) }

  const healthIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <polyline points="3 12 7 6 11 14 15 9 17 12 21 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  const issuesIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="12" y1="9" x2="12" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="17" x2="12.01" y2="17" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )

  const rowsIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <line x1="8" y1="6" x2="21" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8" y1="12" x2="21" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8" y1="18" x2="21" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="3" cy="6" r="1.2" fill="white"/>
      <circle cx="3" cy="12" r="1.2" fill="white"/>
      <circle cx="3" cy="18" r="1.2" fill="white"/>
    </svg>
  )

  const columnsIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="2"/>
      <line x1="9" y1="3" x2="9" y2="21" stroke="white" strokeWidth="2"/>
      <line x1="15" y1="3" x2="15" y2="21" stroke="white" strokeWidth="2"/>
      <line x1="3" y1="9" x2="21" y2="9" stroke="white" strokeWidth="2"/>
    </svg>
  )

  return (
    <div className="container">
      <div className="row g-3 kpi-grid">
        <div className="col-12 col-md-3">
          <KpiCard label="Operational Health" value={m.operationalHealth!} description={m.healthLabel || 'Overall system health'} statusClass={healthStatusClass(m.healthLabel)} icon={healthIcon} iconClass="kpi-icon--health" />
        </div>
        <div className="col-12 col-md-3">
          <KpiCard label="Issues Found" value={m.issuesFound!} description="Detected issues" icon={issuesIcon} iconClass="kpi-icon--issues" />
        </div>
        <div className="col-12 col-md-3">
          <KpiCard label="Rows Processed" value={m.rowsProcessed!} description="CSV records analyzed" icon={rowsIcon} iconClass="kpi-icon--rows" />
        </div>
        <div className="col-12 col-md-3">
          <KpiCard label="Columns" value={m.columns!} description="Data fields analyzed" icon={columnsIcon} iconClass="kpi-icon--columns" />
        </div>
      </div>
    </div>
  )
}
