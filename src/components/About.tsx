// Import dependencies
import aboutImage from '../assets/about1.png'
import aboutImage2 from '../assets/about2.png'
import './About.css'

// Create a function for the about tab
function About() {
  return (
    <section className="about-section">
      <div className="about-header">
        <h1>OpsForge</h1>
        <p className="about-description">
          Less digging. More doing.
        </p>
      </div>

      <div className="about-grid">
        <article className="about-bubble about-bubble--with-image">
          <div className="bubble-text">
            Welcome to OpsForge: IT Support has never been easier.
          </div>
          <img src={aboutImage} alt="About asset" className="bubble-image" />
        </article>

        <article className="about-bubble about-bubble--with-image">
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
          <div className="how-step">
            <div className="how-step-icon">📤</div>
            <h3>Upload</h3>
            <p>Drop your CSV export and let OpsForge ingest the raw data.</p>
          </div>

          <div className="how-step">
            <div className="how-step-icon">🔎</div>
            <h3>Analyze</h3>
            <p>Pandas and parsing logic clean and normalize the rows for processing.</p>
          </div>

          <div className="how-step">
            <div className="how-step-icon">🧠</div>
            <h3>Classify</h3>
            <p>AI assigns issue categories and groups similar tickets automatically.</p>
          </div>

          <div className="how-step">
            <div className="how-step-icon">📈</div>
            <h3>Report</h3>
            <p>Generate clear reports with top issues, trends, and automation opportunities.</p>
          </div>
        </div>
      </section>
    </section>
  )
}

// Export the about component
export default About
