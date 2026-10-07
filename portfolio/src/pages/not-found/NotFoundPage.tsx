import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { useLocale } from '../../app/locale'
import { Header } from '../../components/Header'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  const { t } = useLocale()
  return (
    <>
      <Header />
      <main id="main-content" className={styles.main}>
        <span className="eyebrow">404</span>
        <h1 tabIndex={-1} data-page-heading>
          {t('notFoundTitle')}
        </h1>
        <p>{t('notFound')}</p>
        <Link to="/">
          <ArrowLeft size={16} />
          {t('home')}
        </Link>
      </main>
    </>
  )
}
