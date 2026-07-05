import React, { useState } from 'react'
import './Upload.css'
import BarChart from './BarChart'
import KpiGrid from './KpiGrid'

type IssueCount = {
	issue: string
	count: number
}

type UploadResponse = {
	metrics?: {
		rows?: number
		columns?: string[]
	}
	issue_counts?: IssueCount[]
	report_text?: string
	advice?: string
	health_score?: number
	health_label?: string
}

export default function Upload() {
	const [reportText, setReportText] = useState('')
	const [issueCounts, setIssueCounts] = useState<IssueCount[]>([])
	const [adviceText, setAdviceText] = useState('')
	const [healthScore, setHealthScore] = useState<number | null>(null)
	const [healthLabel, setHealthLabel] = useState('')
	const [selectedFileName, setSelectedFileName] = useState('')
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [totalRows, setTotalRows] = useState<number>(0)
	const [numColumns, setNumColumns] = useState<number>(0)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0] ?? null
		setSelectedFile(file)
		setSelectedFileName(file?.name ?? '')
		setError('')
		setReportText('')
		setIssueCounts([])
		setAdviceText('')
		setHealthScore(null)
		setHealthLabel('')
	}

	async function handleGenerateReport() {
		if (!selectedFile) {
			setError('Please upload a CSV file before generating the report.')
			return
		}

		setLoading(true)
		setError('')
		try {
			const formData = new FormData()
			formData.append('file', selectedFile)

			const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
			const response = await fetch(`${apiBase}/upload`, {
				method: 'POST',
				body: formData
			})

			if (!response.ok) {
				const errorPayload = await response.json().catch(() => null) as { detail?: string } | null
				throw new Error(errorPayload?.detail ?? 'Backend could not process the CSV.')
			}

			const payload = await response.json() as UploadResponse
			setReportText(payload.report_text ?? 'Report generated.')
			setIssueCounts(payload.issue_counts ?? [])
			setAdviceText(payload.advice ?? 'No AI advice returned for this file.')
			setTotalRows(payload.metrics?.rows ?? 0)
			setNumColumns(payload.metrics?.columns?.length ?? 0)
			setHealthScore(payload.health_score ?? null)
			setHealthLabel(payload.health_label ?? '')
		} catch (err) {
			if (err instanceof TypeError) {
				setError(`Could not reach backend at ${import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'}. Start FastAPI and retry.`)
			} else {
				setError(err instanceof Error ? err.message : 'Unable to generate report from backend.')
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<section className="report-area animate-on-load" style={{ ['--order' as any]: 1 }}>
			<div className="report-header report-header--centered">
				<div>
					<h1 className="gradient-title">Generate Report</h1>
					<p>
						Upload your CSV to the box below, then press the blue button to produce the report summary, issue-count bar chart, and AI-generated advice.
					</p>
				</div>
			</div>

			{reportText && (
				<div className="animate-on-load" style={{ ['--order' as any]: 4 }}>
					{
						(() => {
							const totalIssues = issueCounts.reduce((s, it) => s + (it.count || 0), 0)
							const displayScore = healthScore !== null ? healthScore : Math.max(0, 100 - Math.round((totalIssues / (totalRows || 1)) * 100))
							return (
								<KpiGrid metrics={{
									operationalHealth: `${displayScore}%`,
									healthLabel: healthLabel || undefined,
									issuesFound: String(totalIssues),
									rowsProcessed: totalRows.toLocaleString(),
									columns: String(numColumns)
								}} />
							)
						})()
					}
				</div>
			)}

			<div className="upload-card animate-on-load" style={{ ['--order' as any]: 2 }}>
				<label className={`file-label${selectedFileName ? ' file-label--selected' : ''}`}>
					{selectedFileName ? (
						<>
							<svg className="file-label__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M9 12l2 2 4-4" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								<polyline points="14 2 14 8 20 8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
							<span className="file-label__text">{selectedFileName}</span>
						</>
					) : (
						<>
							<svg className="file-label__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								<polyline points="17 8 12 3 7 8" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								<line x1="12" y1="3" x2="12" y2="15" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round"/>
							</svg>
							<span className="file-label__text">
								<strong>Drag &amp; drop</strong> your CSV here, or <span className="file-label__browse">click to browse</span>
							</span>
						</>
					)}
					<input type="file" accept=".csv" onChange={handleFileChange} />
				</label>
				<button className="generate-button" onClick={handleGenerateReport} disabled={loading}>
					{loading ? (
						<span className="btn-spinner"><span /><span /><span /></span>
					) : 'Generate Report'}
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
							<p>Select a CSV file and click Generate Report to see the issue summary and bar chart.</p>
						)}
					</div>
				</div>

				<div className="chart-box animate-on-load" style={{ ['--order' as any]: 3 }}>
					<h2>Issue Counts</h2>
					<BarChart data={issueCounts} />
				</div>
			</div>

			{adviceText && (
				<div className="advice-bubble animate-on-load" style={{ ['--order' as any]: 4 }}>
					<h2>AI Organizational Advice</h2>
					<div className="advice-content">
						{adviceText.split('\n').filter(l => l.trim()).map((line, index) => (
							<div key={index} className="advice-card">
								<span className="advice-card__bullet">→</span>
								<p>{line.replace(/^[•→]\s*/, '')}</p>
							</div>
						))}
					</div>
				</div>
			)}
		</section>
	)
}
