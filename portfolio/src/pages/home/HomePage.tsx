import { useLocale } from '../../app/locale'
import { Header } from '../../components/Header'
import { categories, copyrightYear, profile } from '../../data/portfolio'
import { HomeSector } from './HomeSector'
import styles from './HomePage.module.css'

export function HomePage() {
  const { locale, t } = useLocale()
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
          <span className={`eyebrow ${styles.hello}`}>{t('hello')}</span>
          <h1 tabIndex={-1} data-page-heading aria-label={profile.name}>
            {profile.name.split(' ').map((part, index) => (
              <span key={index}>{part}</span>
            ))}
          </h1>
          <p className={styles.role}>{profile.role[locale]}</p>
          <span className={styles.divider} />
          <p className={styles.invitation}>{profile.invitation[locale]}</p>
        </div>
        <div className={styles.corner}>
          <span className={styles.dot} />
          {t('available')}
        </div>
        <div className={styles.instruction}>
          {t('choose')}
          <span>↗</span>
        </div>
      </main>
      <footer className={styles.footer}>
        <span>{t('footer')}</span>
        <span>
          © {copyrightYear} {profile.name}
        </span>
      </footer>
    </div>
  )
}
