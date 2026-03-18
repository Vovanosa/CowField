import { PageIntro } from '../components/PageIntro'
import './SimplePages.css'

export function AboutPage() {
  return (
    <div className="simple-page">
      <PageIntro
        eyebrow="About"
        title="Project notes will live here."
        description="This page stays intentionally light for now. Later it can explain the rules, the inspiration, and the calm design direction of the puzzle."
      />
      <section className="simple-panel">
        <p>
          Placeholder content. The current focus is the gameplay foundation, not
          long-form copy.
        </p>
      </section>
    </div>
  )
}
