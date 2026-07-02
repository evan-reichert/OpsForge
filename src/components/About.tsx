import aboutImage from '../assets/about1.png'
import './About.css'

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

        <article className="about-bubble">
          default
        </article>

        <article className="about-bubble">
          default
        </article>

        <article className="about-bubble">
          default
        </article>
      </div>
    </section>
  )
}

export default About
