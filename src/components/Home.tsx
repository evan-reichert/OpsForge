import logo from '../assets/logo.png'
import arrowIcon from '../assets/uparrow.png'
import './Home.css'

type HomeProps = {
  onJumpToUpload: () => void
}

export default function Home({ onJumpToUpload }: HomeProps) {
  return (
    <section className="home-page animate-on-load" style={{ ['--order' as any]: 1 }}>
      <div className="container home-page-inner">
        <div className="row gx-5 home-home-row">
          <div className="col-12 col-lg-6 home-hero animate-on-load" style={{ ['--order' as any]: 2 }}>
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
