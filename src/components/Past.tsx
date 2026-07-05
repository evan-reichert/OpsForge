// Import dependencies
import { useEffect, useState } from 'react'
import './Past.css'

// Define the props for the Past component, which includes an optional onOpenReport callback function
type PastProps = {
	onOpenReport?: (id: number) => void
}

type ReportSummary = {
	id: number
	title: string
	filename: string
	created_at: string | null
	health_score: number
	health_label: string
	rows_processed: number
	issue_total: number
}

// Define the past component which will display a list of past reports and allow users to open them
function Past({ onOpenReport }: PastProps) {
	const [hovered, setHovered] = useState<string | null>(null)
  const [reports, setReports] = useState<ReportSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load the list of past reports from the backend when the component mounts
  useEffect(() => {
    async function loadReports() {
      setLoading(true)
      setError('')
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
        const response = await fetch(`${apiBase}/reports`)
        if (!response.ok) {
          throw new Error('Could not load past reports from backend.')
        }
        const payload = await response.json() as ReportSummary[]
        setReports(payload)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load reports.')
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [])

	function openReport(id: number) {
		if (onOpenReport) onOpenReport(id)
	}

	function formatDate(value: string | null): string {
		if (!value) return 'Unknown date'
		const parsed = new Date(value)
		if (Number.isNaN(parsed.getTime())) return 'Unknown date'
		return parsed.toLocaleString()
	}

	// Fallback UI for when there are no reports or when loading
	return (
		<div className="past-window">
			<h2>Past Reports</h2>
			{loading && <div className="past-meta">Loading reports...</div>}
			{error && <div className="error-message">{error}</div>}
			{!loading && !error && reports.length === 0 && (
				<div className="past-meta">No saved reports yet. Upload a CSV in the Upload tab to create one.</div>
			)}
			<div className="past-grid">
				{reports.map((r) => (
					<button
						key={r.id}
						className={`past-slot ${hovered === String(r.id) ? 'is-hover' : ''}`}
						onMouseEnter={() => setHovered(String(r.id))}
						onMouseLeave={() => setHovered(null)}
						onClick={() => openReport(r.id)}
					>
						<div className="past-title">{r.title}</div>
						<div className="past-meta">{r.filename} • {formatDate(r.created_at)}</div>
						<div className="past-meta">Health {r.health_score}% ({r.health_label}) • {r.issue_total} issues • {r.rows_processed} rows</div>
					</button>
				))}
			</div>
		</div>
	)
}

// Export the Past component for use in other parts of the application
export default Past

