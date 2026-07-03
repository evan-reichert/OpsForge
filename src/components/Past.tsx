// Import dependencies
import { useState } from 'react'
import './Past.css'

// Define the props for the Past component, which includes an optional onOpenReport callback function
type PastProps = {
	onOpenReport?: (id: string) => void
}

// Define a sample list of past reports to display in the Past component
const sampleReports = [
	{ id: 'r1', title: 'Weekly Support Summary — 2026-06-28' },
	{ id: 'r2', title: 'Monthly Trend Report — June 2026' },
	{ id: 'r3', title: 'Top Issues Snapshot — Q2' }
]

// Define the past component which will display a list of past reports and allow users to open them
function Past({ onOpenReport }: PastProps) {
	const [hovered, setHovered] = useState<string | null>(null)

	function openReport(id: string) {
		if (onOpenReport) onOpenReport(id)
	}

	return (
		<div className="past-window">
			<h2>Past Reports</h2>
			<div className="past-grid">
				{sampleReports.map((r) => (
					<button
						key={r.id}
						className={`past-slot ${hovered === r.id ? 'is-hover' : ''}`}
						onMouseEnter={() => setHovered(r.id)}
						onMouseLeave={() => setHovered(null)}
						onClick={() => openReport(r.id)}
					>
						<div className="past-title">{r.title}</div>
						<div className="past-meta">Click to open dashboard</div>
					</button>
				))}
			</div>
		</div>
	)
}

// Export the Past component for use in other parts of the application
export default Past

