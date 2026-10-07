import { motion } from 'motion/react'
import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { profile } from '../data/portfolio'
import { CategoryPage } from '../pages/category/CategoryPage'
import { HomePage } from '../pages/home/HomePage'
import { NotFoundPage } from '../pages/not-found/NotFoundPage'
import { useLocale } from './locale'

export function AppRoutes() {
  const location = useLocation()
  const { locale, t } = useLocale()
  useEffect(() => {
    const heading = document.querySelector<HTMLElement>('[data-page-heading]')
    if (location.pathname !== '/') heading?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])
  useEffect(() => {
    const heading = document.querySelector('[data-page-heading]')
    const title =
      location.pathname === '/'
        ? profile.role[locale]
        : heading?.getAttribute('aria-label') || heading?.textContent
    document.title = `${title || profile.role[locale]} — ${profile.name}`
  }, [location.pathname, locale])
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          const main = document.getElementById('main-content')
          if (main) {
            main.tabIndex = -1
            main.focus()
            main.scrollIntoView()
          }
        }}
      >
        {t('skip')}
      </a>
      <motion.div
        key={location.pathname.split('/')[1] || 'home'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/:categoryId" element={<CategoryPage />} />
          <Route path="/:categoryId/:projectId" element={<CategoryPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </motion.div>
    </>
  )
}
