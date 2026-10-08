import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { useLocale } from '../../app/locale'
import { Header } from '../../components/Header'
import { LocalizedText } from '../../components/LocalizedText'
import { messages } from '../../data/messages'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  const { t } = useLocale()
  return (
    <>
      <Header />
      <main id="main-content" className={styles.main}>
        <span className="eyebrow">404</span>
        <h1 tabIndex={-1} data-page-heading aria-label={t('notFoundTitle')}>
          <LocalizedText value={messages.notFoundTitle} />
        </h1>
        <p>
          <LocalizedText value={messages.notFound} paragraph />
        </p>
        <Link to="/">
          <ArrowLeft size={16} />
          <LocalizedText value={messages.home} />
        </Link>
      </main>
    </>
  )
}
