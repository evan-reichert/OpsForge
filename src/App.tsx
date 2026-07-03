import { useState, useRef, useEffect } from 'react'
import './App.css'
import Tabs from './components/Tabs'
import About from './components/About'
import Past from './components/Past'
import Upload from './components/Upload'


function App() {
  const [activeTab, setActiveTab] = useState('upload')
  const rootRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    // Add loaded class shortly after mount to trigger entrance animations
    if (rootRef.current) {
      setTimeout(() => rootRef.current && rootRef.current.classList.add('has-loaded'), 40)
    }
  }, [])
  
  const [openedReportId, setOpenedReportId] = useState<string | null>(null)

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

      {activeTab === 'upload' && <Upload />}

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
