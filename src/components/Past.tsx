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

	function healthTone(label: string): string {
		const normalized = label.toLowerCase()
		if (normalized === 'excellent' || normalized === 'good') return 'health-pill--good'
		if (normalized === 'fair') return 'health-pill--fair'
		return 'health-pill--risk'
	}

	const totalReports = reports.length
	const totalRowsProcessed = reports.reduce((sum, report) => sum + (report.rows_processed || 0), 0)
	const totalIssues = reports.reduce((sum, report) => sum + (report.issue_total || 0), 0)
	const avgHealth = totalReports > 0
		? Math.round(reports.reduce((sum, report) => sum + (report.health_score || 0), 0) / totalReports)
		: 0

	const reportsIcon = (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path d="M7 3h7l5 5v13a1 1 0 01-1 1H7a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M14 3v5h5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M9 13h6M9 17h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)

	const rowsIcon = (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<line x1="8" y1="6" x2="21" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round" />
			<line x1="8" y1="12" x2="21" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" />
			<line x1="8" y1="18" x2="21" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round" />
			<circle cx="3.5" cy="6" r="1.25" fill="white" />
			<circle cx="3.5" cy="12" r="1.25" fill="white" />
			<circle cx="3.5" cy="18" r="1.25" fill="white" />
		</svg>
	)

	const healthIcon = (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path d="M4 14l4-4 4 3 6-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M19 6h-4v4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)

	const issuesIcon = (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path d="M12 9v4" stroke="white" strokeWidth="2" strokeLinecap="round" />
			<path d="M12 17h.01" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
			<path d="M10.3 3.9L1.82 18a2 2 0 001.72 3h16.92a2 2 0 001.72-3L13.7 3.9a2 2 0 00-3.4 0z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)

	// Fallback UI for when there are no reports or when loading
	return (
		<div className="past-window">
			<div className="past-hero">
				<div>
					<h2>Past Reports</h2>
					<p className="past-subtitle">Reopen saved dashboards, review trends, and quickly compare operational health over time.</p>
				</div>
				<div className="past-stats">
					<div className="past-stat-card">
						<div className="past-stat-card__top">
							<span className="past-stat-card__icon past-stat-card__icon--reports">{reportsIcon}</span>
							<span>Reports</span>
						</div>
						<strong>{totalReports}</strong>
					</div>
					<div className="past-stat-card">
						<div className="past-stat-card__top">
							<span className="past-stat-card__icon past-stat-card__icon--rows">{rowsIcon}</span>
							<span>Rows analyzed</span>
						</div>
						<strong>{totalRowsProcessed.toLocaleString()}</strong>
					</div>
					<div className="past-stat-card">
						<div className="past-stat-card__top">
							<span className="past-stat-card__icon past-stat-card__icon--health">{healthIcon}</span>
							<span>Average health</span>
						</div>
						<strong>{avgHealth}%</strong>
					</div>
					<div className="past-stat-card">
						<div className="past-stat-card__top">
							<span className="past-stat-card__icon past-stat-card__icon--issues">{issuesIcon}</span>
							<span>Total issues</span>
						</div>
						<strong>{totalIssues.toLocaleString()}</strong>
					</div>
				</div>
			</div>

			{loading && <div className="past-status">Loading reports...</div>}
			{error && <div className="error-message">{error}</div>}
			{!loading && !error && reports.length === 0 && (
				<div className="past-empty">
					<div className="past-empty__icon">📂</div>
					<p>No saved reports yet. Upload a CSV in the Upload tab to create your first report.</p>
				</div>
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
						<div className="past-slot__top">
							<span className={`health-pill ${healthTone(r.health_label)}`}>{r.health_label}</span>
							<span className="past-date">{formatDate(r.created_at)}</span>
						</div>
						<div className="past-title">{r.title}</div>
						<div className="past-meta">{r.filename}</div>
						<div className="past-metrics-row">
							<div className="past-mini-metric">
								<span>Health</span>
								<strong>{r.health_score}%</strong>
							</div>
							<div className="past-mini-metric">
								<span>Issues</span>
								<strong>{r.issue_total}</strong>
							</div>
							<div className="past-mini-metric">
								<span>Rows</span>
								<strong>{r.rows_processed}</strong>
							</div>
						</div>
						<div className="past-open-hint">Open dashboard →</div>
					</button>
				))}
			</div>
		</div>
	)
}

// Export the Past component for use in other parts of the application
export default Past

