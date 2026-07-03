import React from 'react'
import KpiCard from './KpiCard'
import './Kpi.css'

type Metrics = {
  operationalHealth?: string
  issuesFound?: string
  rowsProcessed?: string
  columns?: string
}

export default function KpiGrid({ metrics }: { metrics?: Metrics }) {
  const defaults: Metrics = {
    operationalHealth: '92%',
    issuesFound: '6',
    rowsProcessed: '12,431',
    columns: '14'
  }

  const m = { ...defaults, ...(metrics || {}) }

  return (
    <div className="container">
      <div className="row g-3 kpi-grid">
        <div className="col-12 col-md-3">
          <KpiCard label="Operational Health" value={m.operationalHealth!} description="Overall system health" />
        </div>
        <div className="col-12 col-md-3">
          <KpiCard label="Issues Found" value={m.issuesFound!} description="Detected issues" />
        </div>
        <div className="col-12 col-md-3">
          <KpiCard label="Rows Processed" value={m.rowsProcessed!} description="CSV records analyzed" />
        </div>
        <div className="col-12 col-md-3">
          <KpiCard label="Columns" value={m.columns!} description="Data fields analyzed" />
        </div>
      </div>
    </div>
  )
}
