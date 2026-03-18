import { ArrowRight, BookOpenText, Play, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageIntro } from '../components/PageIntro'
import { SurfaceCard } from '../components/SurfaceCard'
import './HomePage.css'

export function HomePage() {
  return (
    <div className="home-page">
      <PageIntro
        eyebrow="Offline puzzle prototype"
        title="Build the calm puzzle shell before the first level logic."
        description="This first pass sets up the app structure for the Bullpen-inspired project: pages, navigation, visual tone, and a clean place to start building board logic next."
        actions={
          <>
            <Link className="primary-button" to="/levels">
              <Play size={18} />
              Play
            </Link>
            <Link className="secondary-button" to="/about">
              Learn the rules
            </Link>
          </>
        }
      />

      <section className="home-grid">
        <SurfaceCard
          icon={<Play size={20} />}
          title="Level path"
          description="The level select flow will unlock one puzzle at a time and remember your best times locally."
          detail={
            <ul className="feature-list">
              <li>Handcrafted 10x10 boards</li>
              <li>Single-player and offline</li>
              <li>Replayable levels with time tracking</li>
            </ul>
          }
          action={
            <Link className="text-link" to="/levels">
              Open level select
              <ArrowRight size={16} />
            </Link>
          }
        />

        <SurfaceCard
          icon={<BookOpenText size={20} />}
          title="Rule set"
          description="Rows, columns, and pens must all satisfy the target bull count while keeping every bull at least one cell apart in all 8 directions."
          detail={
            <p className="support-copy">
              Dot markers are optional player notes. Validation only matters once the required number of bulls has been placed.
            </p>
          }
          action={
            <Link className="text-link" to="/about">
              View project notes
              <ArrowRight size={16} />
            </Link>
          }
        />

        <SurfaceCard
          icon={<Settings size={20} />}
          title="Project base"
          description="The repo is now structured for the next stage: types, levels, rules, validation, and storage modules."
          detail={
            <p className="support-copy">
              We will add the board model and rule engine before touching generators, hints, or leaderboard work.
            </p>
          }
          action={
            <Link className="text-link" to="/settings">
              Open settings
              <ArrowRight size={16} />
            </Link>
          }
        />
      </section>
    </div>
  )
}
