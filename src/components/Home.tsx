import logo from '../assets/logo.png'
import arrowIcon from '../assets/uparrow.png'
import './Home.css'

type HomeProps = {
  onJumpToUpload: () => void
}

export default function Home({ onJumpToUpload }: HomeProps) {
  const diagnosticsIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v4" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 17v4" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M4.93 4.93l2.83 2.83" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M16.24 16.24l2.83 2.83" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 12h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 12h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M4.93 19.07l2.83-2.83" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M16.24 7.76l2.83-2.83" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3.5" stroke="white" strokeWidth="2" />
    </svg>
  )

  const reportsIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19h16" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 16V9" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 16V5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 16v-7" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )

  const secureIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 12.5l1.7 1.7 3.3-3.7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  return (
    <section className="home-page animate-on-load" style={{ ['--order' as any]: 1 }}>
      <div className="container home-page-inner">
        <div className="row gx-5 home-home-row">
          <div className="col-12 col-lg-6 home-hero animate-on-load" style={{ ['--order' as any]: 2 }}>
            <div>
              <div className="home-hero-title">
                <img src={logo} alt="OpsForge logo" className="home-logo" />
                <div className="home-heading-text">
                  <h1>
                    <span className="home-heading-small">Welcome to</span>
                    <span className="home-heading-large">OpsForge</span>
                  </h1>
                </div>
              </div>
              <p className="home-intro">
                Your centralized assistant for helpdesk analytics, report generation, and faster operational decisions.
              </p>
            </div>
            <div className="home-feature-grid animate-on-load" style={{ ['--order' as any]: 4 }}>
              <article className="home-feature-card">
                <span className="home-feature-icon home-feature-icon--diagnostics">{diagnosticsIcon}</span>
                <div>
                  <h3>AI Diagnostics</h3>
                  <p>Find operational issues automatically.</p>
                </div>
              </article>
              <article className="home-feature-card">
                <span className="home-feature-icon home-feature-icon--reports">{reportsIcon}</span>
                <div>
                  <h3>Smart Reports</h3>
                  <p>Interactive charts & executive summaries.</p>
                </div>
              </article>
              <article className="home-feature-card">
                <span className="home-feature-icon home-feature-icon--secure">{secureIcon}</span>
                <div>
                  <h3>Secure Processing</h3>
                  <p>Your CSV stays private.</p>
                </div>
              </article>
            </div>
          </div>

          <div className="col-12 col-lg-6 home-action-wrapper animate-on-load" style={{ ['--order' as any]: 3 }}>
            <button className="home-action-card home-action-stretch" onClick={onJumpToUpload}>
              <span className="home-action-title">Upload a CSV</span>
              <span className="home-action-subtitle">Start your first report by uploading a helpdesk export.</span>
              <img src={arrowIcon} alt="Upload arrow" className="home-action-emoji" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
