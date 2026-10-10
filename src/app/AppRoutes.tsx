import { useEffect, useLayoutEffect } from 'react'
import { Navigate, useLocation } from 'react-router'
import { profile, getCategory } from '../data/portfolio'
import { messages } from '../data/messages'
import { LocalizedText } from '../components/LocalizedText'
import { HomePage } from '../pages/home/HomePage'
import { useLocale } from './locale'

export function AppRoutes() {
  const location = useLocation()
  const category = getCategory(location.pathname.slice(1))
  const { locale, finishLocaleTransition } = useLocale()
  useLayoutEffect(() => {
    finishLocaleTransition()
  }, [location.pathname, finishLocaleTransition])
  useEffect(() => {
    document.title = `${category?.label[locale] ?? profile.role[locale]} — ${profile.name}`
  }, [category, locale])
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
        <LocalizedText value={messages.skip} />
      </a>
      {location.pathname !== '/' && !category && <Navigate to="/" replace />}
      <HomePage category={category?.id} />
    </>
  )
}
