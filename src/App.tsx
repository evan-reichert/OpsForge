import { useState, useRef, useEffect } from 'react'
import './App.css'
import Tabs from './components/Tabs'
import Home from './components/Home'
import About from './components/About'
import Past from './components/Past'
import Upload from './components/Upload'
import Auth from './components/Auth'
import KpiGrid from './components/KpiGrid'
import BarChart from './components/BarChart'


type IssueCount = {
  issue: string
  count: number
}

type StoredReport = {
  id: number
  title: string
  filename: string
  created_at: string | null
  report_text?: string
  advice?: string
  issue_counts?: IssueCount[]
  health_score?: number
  health_label?: string
  metrics?: {
    rows?: number
    columns?: string[]
  }
}


function App() {
  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem('opsforge_access_token') ?? '')
  const [activeTab, setActiveTab] = useState('home')
  const rootRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    // Add loaded class shortly after mount to trigger entrance animations
    if (rootRef.current) {
      setTimeout(() => rootRef.current && rootRef.current.classList.add('has-loaded'), 40)
    }
  }, [])
  
  const [openedReportId, setOpenedReportId] = useState<number | null>(null)
  const [openedReport, setOpenedReport] = useState<StoredReport | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState('')

  useEffect(() => {
    if (openedReportId === null) {
      setOpenedReport(null)
      setReportError('')
      return
    }

    async function loadReport() {
      setReportLoading(true)
      setReportError('')
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
        const response = await fetch(`${apiBase}/reports/${openedReportId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        })
        if (!response.ok) {
          throw new Error('Unable to load selected report.')
        }
        const payload = await response.json() as StoredReport
        setOpenedReport(payload)
      } catch (err) {
        setReportError(err instanceof Error ? err.message : 'Unable to load selected report.')
      } finally {
        setReportLoading(false)
      }
    }

    loadReport()
  }, [openedReportId, authToken])

  if (!authToken) {
    return (
      <div ref={rootRef} className="app-root">
        <Auth onAuthenticated={(token) => {
          sessionStorage.setItem('opsforge_access_token', token)
          setAuthToken(token)
        }} />
      </div>
    )
  }

  return (
    <div ref={rootRef} className="app-root">
      <Tabs activeTab={activeTab} onTabChange={(tab) => {
        // trigger tab switch animation by briefly resetting loaded state
        if (rootRef.current) {
          rootRef.current.classList.remove('has-loaded')
          setTimeout(() => rootRef.current && rootRef.current.classList.add('has-loaded'), 30)
        }
        setActiveTab(tab)
      }} onLogout={() => {
        sessionStorage.removeItem('opsforge_access_token')
        setAuthToken('')
        setActiveTab('home')
        setOpenedReportId(null)
      }} />

      {activeTab === 'home' && <Home onJumpToUpload={() => setActiveTab('upload')} />}

      {activeTab === 'upload' && <Upload authToken={authToken} />}

      {activeTab === 'reports' && (
        <section className="report-area animate-on-load" style={{ ['--order' as any]: 1 }}>
          <Past authToken={authToken} onOpenReport={setOpenedReportId} />
        </section>
      )}

      {openedReportId && (
        <div className="dashboard-overlay" onClick={() => setOpenedReportId(null)}>
          <div className="dashboard-modal" onClick={(e) => e.stopPropagation()}>
            <button className="dashboard-close" onClick={() => setOpenedReportId(null)}>×</button>
            <h2>{openedReport?.title ?? `Dashboard: Report ${openedReportId}`}</h2>
            <div className="dashboard-content">
              {reportLoading && <p>Loading dashboard...</p>}
              {reportError && <div className="error-message">{reportError}</div>}
              {!reportLoading && !reportError && openedReport && (
                <>
                  <KpiGrid metrics={{
                    operationalHealth: `${openedReport.health_score ?? 0}%`,
                    healthLabel: openedReport.health_label ?? undefined,
                    issuesFound: String((openedReport.issue_counts ?? []).reduce((sum, item) => sum + item.count, 0)),
                    rowsProcessed: String(openedReport.metrics?.rows ?? 0),
                    columns: String(openedReport.metrics?.columns?.length ?? 0)
                  }} />
                  <div className="report-grid" style={{ marginTop: '1.25rem' }}>
                    <div className="report-box">
                      <h2>Saved Report Output</h2>
                      <div className="report-content">
                        {(openedReport.report_text ?? 'No report text was stored.').split('\n').map((line, index) => (
                          <p key={index}>{line}</p>
                        ))}
                      </div>
                    </div>
                    <div className="chart-box">
                      <h2>Saved Issue Counts</h2>
                      <BarChart data={openedReport.issue_counts ?? []} />
                    </div>
                  </div>
                  {openedReport.advice && (
                    <div className="advice-bubble" style={{ marginTop: '1.25rem' }}>
                      <h2>Saved AI Advice</h2>
                      <div className="advice-content">
                        {openedReport.advice.split('\n').filter(line => line.trim()).map((line, index) => (
                          <div key={index} className="advice-card">
                            <span className="advice-card__bullet">→</span>
                            <p>{line.replace(/^[•→]\s*/, '')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

        {activeTab === 'about' && <About />}
      </div>
    )
}

export default App
