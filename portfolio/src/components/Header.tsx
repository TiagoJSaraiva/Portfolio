import { GithubIcon, LinkedinIcon } from './BrandIcons'
import { useLocale } from '../app/locale'
import { profile } from '../data/portfolio'
import styles from './Header.module.css'

export function Header() {
  const { locale, t, toggleLocale, transition } = useLocale()
  const activeLocale = transition?.to ?? locale
  return (
    <header className={styles.header}>
      <div className={styles.right}>
        <button
          className={styles.language}
          onClick={toggleLocale}
          aria-label={t('language')}
          aria-disabled={transition ? true : undefined}
        >
          <span className={styles.languageCode} data-active={activeLocale === 'en'}>
            EN
          </span>
          <span className={styles.languageCode} data-active={activeLocale === 'pt'}>
            PT
          </span>
        </button>
        <div className={styles.socials}>
          {profile.githubUrl && (
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('profileGithub')}
            >
              <GithubIcon />
            </a>
          )}
          {profile.linkedinUrl && (
            <a
              href={profile.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('profileLinkedin')}
            >
              <LinkedinIcon />
            </a>
          )}
        </div>
      </div>
    </header>
  )
}
