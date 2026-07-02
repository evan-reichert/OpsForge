import { useState } from 'react'
import './App.css'
import Tabs from './components/Tabs'
import About from './components/About'
import BarChart from './components/BarChart'

function App() {
  const [activeTab, setActiveTab] = useState('upload')
  const [reportText, setReportText] = useState('')
  const [issueCounts, setIssueCounts] = useState<{ issue: string; count: number }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    <>
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'upload' && (
        <section className="report-area">
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
            <div className="report-box">
              <h2>Report Output</h2>
              <div className="report-content">
                {reportText ? (
                  reportText.split('\n').map((line, index) => <p key={index}>{line}</p>)
                ) : (
                  <p>Click Generate Report after uploading your CSV and processing it on the backend.</p>
                )}
              </div>
            </div>

            <div className="chart-box">
              <h2>Issue Counts</h2>
              <BarChart data={issueCounts} />
            </div>
          </div>
        </section>
      )}

      {activeTab === 'reports' && (
        <section className="report-area">
          <div className="report-header">
            <div>
              <h1>Past Reports</h1>
              <p>Past reports will appear here once backend storage integration is available.</p>
            </div>
          </div>

          <div className="report-box">
            <p>Coming soon: historical issue reports, export options, and summary insights.</p>
          </div>
        </section>
      )}

      {activeTab === 'about' && <About />}
    </>
  )
}

export default App
