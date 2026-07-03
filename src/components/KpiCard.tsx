import React from 'react'
import './Kpi.css'

type KpiCardProps = {
  label: string
  value: string
  description?: string
}

export default function KpiCard({ label, value, description }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#FF8A00"/>
        </svg>
      </div>

      <div className="kpi-body">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        {description && <div className="kpi-desc">{description}</div>}
      </div>
    </div>
  )
}
