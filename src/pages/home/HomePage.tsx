import { Header } from '../../components/Header'
import { LocalizedText } from '../../components/LocalizedText'
import { messages } from '../../data/messages'
import { categories, copyrightYear, profile } from '../../data/portfolio'
import { HomeSector } from './HomeSector'
import styles from './HomePage.module.css'

export function HomePage() {
  return (
    <div className={styles.page}>
      <Header />
      <main id="main-content" className={styles.composition}>
        <div className={styles.grid} aria-hidden="true" />
        <svg
          className={styles.boundaries}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M50 0V33.333333L0 100M50 33.333333 100 100"
            fill="none"
            stroke="#ffffff0c"
            strokeWidth=".07"
          />
        </svg>
        <div className={styles.sectors}>
          {categories.map((category, index) => (
            <HomeSector key={category.id} category={category} index={index} />
          ))}
        </div>
        <div className={styles.hub}>
          <LocalizedText className={`eyebrow ${styles.hello}`} value={messages.hello} />
          <h1 tabIndex={-1} data-page-heading aria-label={profile.name}>
            {profile.name.split(' ').map((part, index) => (
              <span key={index}>{part}</span>
            ))}
          </h1>
          <p className={styles.role}>
            <LocalizedText value={profile.role} variant="body" />
          </p>
          <span className={styles.divider} />
          <p className={styles.invitation}>
            <LocalizedText value={profile.invitation} variant="body" />
          </p>
        </div>
      </main>
      <footer className={styles.footer}>
        <LocalizedText value={messages.footer} variant="body" />
        <span>
          © {copyrightYear} {profile.name}
        </span>
      </footer>
    </div>
  )
}
