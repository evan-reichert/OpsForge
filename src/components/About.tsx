// Import dependencies
import aboutImage from '../assets/about1.png'
import aboutImage2 from '../assets/about2.png'
import headshot from '../assets/headshot.png'
import './About.css'

// Create a function for the about tab
function About() {
  const uploadIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4v11" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 8l4-4 4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20h16" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )

  const analyzeIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6" stroke="white" strokeWidth="2" />
      <path d="M20 20l-4.35-4.35" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 8v6" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 11h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )

  const classifyIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 8h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 12h5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 16h7" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 5h14v14H5z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )

  const reportIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19h14" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 16l3-3 3 2 4-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 9h3v3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  return (
    <section className="about-section">
      <div className="about-header animate-on-load" style={{ ['--order' as any]: 1 }}>
        <h1>OpsForge</h1>
        <p className="about-description">
          Less digging. More doing.
        </p>
      </div>


      <div className="about-grid">
        <article className="about-bubble about-bubble--with-image animate-on-load" style={{ ['--order' as any]: 2 }}>
          <div className="bubble-text">
            Welcome to OpsForge: IT Support has never been easier.
          </div>
          <img src={aboutImage} alt="About asset" className="bubble-image" />
        </article>

        <article className="about-bubble about-bubble--with-image animate-on-load" style={{ ['--order' as any]: 3 }}>
          <div className="bubble-text">
            OpsForge scans CSV exports from any helpdesk and generates the report your ops team needs 
            -- bottlenecks, repeat issues, and the workflows worth automating.
          </div>
          <img src={aboutImage2} alt="About asset" className="bubble-image" />
        </article>

      </div>

      <section className="how-it-works">
        <h2>How it works</h2>
        <p className="how-intro">Upload a CSV from any helpdesk, OpsForge parses and categorizes issues, then generates actionable reports.</p>

        <div className="how-grid">
          <div className="how-step animate-on-load" style={{ ['--order' as any]: 4 }}>
            <div className="how-step-icon how-step-icon--upload">{uploadIcon}</div>
            <h3>Upload</h3>
            <p>Drop your CSV export and let OpsForge ingest the raw data.</p>
          </div>

          <div className="how-step animate-on-load" style={{ ['--order' as any]: 5 }}>
            <div className="how-step-icon how-step-icon--analyze">{analyzeIcon}</div>
            <h3>Analyze</h3>
            <p>Pandas and parsing logic clean and normalize the rows for processing.</p>
          </div>

          <div className="how-step animate-on-load" style={{ ['--order' as any]: 6 }}>
            <div className="how-step-icon how-step-icon--classify">{classifyIcon}</div>
            <h3>Classify</h3>
            <p>AI assigns issue categories and groups similar tickets automatically.</p>
          </div>

          <div className="how-step animate-on-load" style={{ ['--order' as any]: 7 }}>
            <div className="how-step-icon how-step-icon--report">{reportIcon}</div>
            <h3>Report</h3>
            <p>Generate clear reports with top issues, trends, and automation opportunities.</p>
          </div>
        </div>
      </section>

      <section className="behind-backend animate-on-load" style={{ ['--order' as any]: 8 }}>
        <h2>Behind OpsForge</h2>
        <div className="backend-card">
          <img src={headshot} alt="Evan Reichert" className="backend-headshot" />
          <div className="backend-info">
            <h3>Evan Reichert</h3>
            <p>Computer Science Student who is passionate about programming and building tools that make IT teams' lives easier.</p>
          </div>
        </div>
      </section>
    </section>
  )
}

// Export the about component
export default About
