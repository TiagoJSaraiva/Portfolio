import { ArrowUpRight } from 'lucide-react'
import { GithubIcon, LinkedinIcon } from './BrandIcons'
import { Link } from 'react-router'
import { useLocale } from '../app/locale'
import { categories, profile } from '../data/portfolio'
import type { CategoryId } from '../data/types'
import { CategoryIcon } from './CategoryIcon'
import styles from './Header.module.css'

export function Header({ category }: { category?: CategoryId }) {
  const { locale, t, toggleLocale } = useLocale()
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand} aria-label={`${profile.name} — ${t('home')}`}>
        ts<span>.</span>
      </Link>
      {category && (
        <Link className={styles.home} to="/">
          {t('home')}
          <ArrowUpRight size={13} />
        </Link>
      )}
      <div className={styles.right}>
        <button className={styles.language} onClick={toggleLocale} aria-label={t('language')}>
          <span className={styles.languageCode} data-active={locale === 'en'}>
            EN
          </span>
          <span className={styles.languageCode} data-active={locale === 'pt'}>
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
        {category && (
          <nav className={styles.categories} aria-label={t('categoryNav')}>
            {categories
              .filter((item) => item.id !== category)
              .map((item) => (
                <Link
                  key={item.id}
                  to={`/${item.id}`}
                  aria-label={item.label[locale]}
                  title={item.label[locale]}
                  data-category={item.id}
                >
                  <CategoryIcon category={item.id} />
                  <span>{item.label[locale]}</span>
                </Link>
              ))}
          </nav>
        )}
      </div>
    </header>
  )
}
