import { useState, useRef, useEffect } from 'react'
import './App.css'
import Tabs from './components/Tabs'
import About from './components/About'
import Past from './components/Past'
import BarChart from './components/BarChart'

function App() {
  const [activeTab, setActiveTab] = useState('upload')
  const rootRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    // Add loaded class shortly after mount to trigger entrance animations
    if (rootRef.current) {
      setTimeout(() => rootRef.current && rootRef.current.classList.add('has-loaded'), 40)
    }
  }, [])
  const [reportText, setReportText] = useState('')
  const [issueCounts, setIssueCounts] = useState<{ issue: string; count: number }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openedReportId, setOpenedReportId] = useState<string | null>(null)

  async function handleGenerateReport() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'csv' })
      })

      if (!response.ok) {
        throw new Error('Report endpoint failed')
      }

      const result = await response.json()
      setReportText(result.reportText ?? 'Report generated successfully.')
      setIssueCounts(result.issueCounts ?? [])
    } catch (err) {
      setError('Unable to generate report. Check the backend endpoint and try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
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
      }} />

      {activeTab === 'upload' && (
        <section className="report-area animate-on-load" style={{ ['--order' as any]: 1 }}>
          <div className="report-header">
            <div>
              <h1>Generated Report</h1>
              <p>
                Once pandas processes the CSV and OpenAI assigns issue categories, the issue counts chart appears here.
              </p>
            </div>
            <button className="generate-button" onClick={handleGenerateReport} disabled={loading}>
              {loading ? 'Generating…' : 'Generate Report'}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="report-grid">
            <div className="report-box animate-on-load" style={{ ['--order' as any]: 2 }}>
              <h2>Report Output</h2>
              <div className="report-content">
                {reportText ? (
                  reportText.split('\n').map((line, index) => <p key={index}>{line}</p>)
                ) : (
                  <p>Click Generate Report after uploading your CSV and processing it on the backend.</p>
                )}
              </div>
            </div>

            <div className="chart-box animate-on-load" style={{ ['--order' as any]: 3 }}>
              <h2>Issue Counts</h2>
              <BarChart data={issueCounts} />
            </div>
          </div>
        </section>
      )}

      {activeTab === 'reports' && (
        <section className="report-area animate-on-load" style={{ ['--order' as any]: 1 }}>
          <Past onOpenReport={setOpenedReportId} />
        </section>
      )}

      {openedReportId && (
        <div className="dashboard-overlay" onClick={() => setOpenedReportId(null)}>
          <div className="dashboard-modal" onClick={(e) => e.stopPropagation()}>
            <button className="dashboard-close" onClick={() => setOpenedReportId(null)}>×</button>
            <h2>Dashboard: Report {openedReportId}</h2>
            <div className="dashboard-content">
              <p>Old dashboard data would load here for report <strong>{openedReportId}</strong></p>
              <p>Backend integration would fetch historical data, metrics, and details for this report.</p>
            </div>
          </div>
        </div>
      )}

        {activeTab === 'about' && <About />}
      </div>
    )
}

export default App
