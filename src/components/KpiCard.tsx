import './Kpi.css'

import type { ReactNode } from 'react'

type KpiCardProps = {
  label: string
  value: string
  description?: string
  statusClass?: string
  icon?: ReactNode
  iconClass?: string
}

export default function KpiCard({ label, value, description, statusClass, icon, iconClass }: KpiCardProps) {
  return (
    <div className={`kpi-card${statusClass ? ` ${statusClass}` : ''}`}>
      <div className={`kpi-icon${iconClass ? ` ${iconClass}` : ''}`} aria-hidden="true">
        {icon ?? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2"/>
          </svg>
        )}
      </div>

      <div className="kpi-body">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        {description && <div className="kpi-desc">{description}</div>}
      </div>
    </div>
  )
}
