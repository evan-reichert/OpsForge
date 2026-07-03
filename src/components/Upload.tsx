import React, { useState } from 'react'
import './Upload.css'
import BarChart from './BarChart'
import KpiGrid from './KpiGrid'

type IssueCount = {
	issue: string
	count: number
}

function parseCsv(text: string): string[][] {
	const rows: string[][] = []
	const lines = text.replace(/\r\n/g, '\n').split('\n')
	for (const line of lines) {
		if (!line.trim()) continue
		const row: string[] = []
		let current = ''
		let inQuotes = false
		for (let i = 0; i < line.length; i += 1) {
			const char = line[i]
			if (char === '"') {
				if (inQuotes && line[i + 1] === '"') {
					current += '"'
					i += 1
				} else {
					inQuotes = !inQuotes
				}
			} else if (char === ',' && !inQuotes) {
				row.push(current)
				current = ''
			} else {
				current += char
			}
		}
		row.push(current)
		rows.push(row)
	}
	return rows
}

function summarizeCsv(rows: string[][]): { reportText: string; issueCounts: IssueCount[]; totalRows: number; columns: number } {
	if (rows.length < 2) {
		return {
			reportText: 'The uploaded CSV did not contain enough rows to generate a report.',
			issueCounts: [],
			totalRows: 0,
			columns: rows[0]?.length ?? 0
		}
	}

	const header = rows[0].map((h) => h.trim().toLowerCase())
	const categoryIndex = header.findIndex((col) => ['category', 'issue category', 'issue_type', 'issue type', 'type'].includes(col))
	const summaryIndex = header.findIndex((col) => ['issue', 'summary', 'description', 'subject', 'ticket'].includes(col))

	const counts = new Map<string, number>()
	const keywordCategories = [
		{ name: 'Login Issues', keywords: ['login', 'sign in', 'signin', 'credentials', 'password'] },
		{ name: 'Performance', keywords: ['slow', 'lag', 'delay', 'performance', 'timeout'] },
		{ name: 'Errors', keywords: ['error', 'fail', 'failure', 'exception', 'crash', 'bug'] },
		{ name: 'Setup / Access', keywords: ['access', 'setup', 'install', 'permission', 'configure'] },
		{ name: 'Network', keywords: ['network', 'wifi', 'connection', 'latency', 'vpn'] }
	]

	for (let i = 1; i < rows.length; i += 1) {
		const row = rows[i]
		let category = 'Other'
		if (categoryIndex !== -1 && row[categoryIndex]) {
			category = row[categoryIndex].trim() || 'Other'
		} else if (summaryIndex !== -1 && row[summaryIndex]) {
			const text = row[summaryIndex].toLowerCase()
			const found = keywordCategories.find((group) => group.keywords.some((word) => text.includes(word)))
			category = found?.name || 'Other'
		} else {
			const text = row.join(' ').toLowerCase()
			const found = keywordCategories.find((group) => group.keywords.some((word) => text.includes(word)))
			category = found?.name || 'Other'
		}
		counts.set(category, (counts.get(category) ?? 0) + 1)
	}

	const issueCounts: IssueCount[] = Array.from(counts.entries()).map(([issue, count]) => ({ issue, count }))
	const total = rows.length - 1
	const topCategories = issueCounts.sort((a, b) => b.count - a.count).slice(0, 3)
	const summaryLines = [
		`Processed ${total} CSV ${total === 1 ? 'row' : 'rows'} successfully.`,
		`Detected ${issueCounts.length} issue category ${issueCounts.length === 1 ? 'type' : 'types'}.`,
		'Top categories:'
	]
	for (const entry of topCategories) {
		summaryLines.push(`- ${entry.issue}: ${entry.count}`)
	}

	return {
		reportText: summaryLines.join('\n'),
		issueCounts,
		totalRows: total,
		columns: rows[0].length
	}
}

export default function Upload() {
	const [reportText, setReportText] = useState('')
	const [issueCounts, setIssueCounts] = useState<IssueCount[]>([])
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
	}

	function handleGenerateReport() {
		if (!selectedFile) {
			setError('Please upload a CSV file before generating the report.')
			return
		}

		setLoading(true)
		setError('')
		const reader = new FileReader()
		reader.onload = () => {
			try {
				const text = reader.result?.toString() ?? ''
				const rows = parseCsv(text)
				const { reportText: generatedText, issueCounts: generatedCounts, totalRows: tr, columns: cols } = summarizeCsv(rows)
				setReportText(generatedText)
				setIssueCounts(generatedCounts)
				setTotalRows(tr)
				setNumColumns(cols)
			} catch (err) {
				setError('Unable to parse the uploaded CSV file. Please verify the file format and try again.')
			} finally {
				setLoading(false)
			}
		}
		reader.onerror = () => {
			setError('Unable to read the uploaded file. Please try again.')
			setLoading(false)
		}
		reader.readAsText(selectedFile)
	}

	return (
		<section className="report-area animate-on-load" style={{ ['--order' as any]: 1 }}>
			<div className="report-header report-header--centered">
				<div>
					<h1 className="gradient-title">Generate Report</h1>
					<p>
						Upload your CSV to the box below, then press the blue button to produce both the report summary and the issue-count bar chart.
					</p>
				</div>
			</div>

			{reportText && (
				<div className="animate-on-load" style={{ ['--order' as any]: 4 }}>
					{
						(() => {
							const totalIssues = issueCounts.reduce((s, it) => s + (it.count || 0), 0)
							const health = totalRows > 0 ? Math.max(0, 100 - Math.round((totalIssues / totalRows) * 100)) : 100
							return (
								<KpiGrid metrics={{
									operationalHealth: `${health}%`,
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
				<label className="file-label">
					<span>{selectedFileName || 'Choose a CSV file from your helpdesk export'}</span>
					<input type="file" accept=".csv" onChange={handleFileChange} />
				</label>
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
							<p>Select a CSV file and click Generate Report to see the issue summary and bar chart.</p>
						)}
					</div>
				</div>

				<div className="chart-box animate-on-load" style={{ ['--order' as any]: 3 }}>
					<h2>Issue Counts</h2>
					<BarChart data={issueCounts} />
				</div>
			</div>
		</section>
	)
}
