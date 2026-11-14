import { MotionConfig } from 'motion/react'
import { HashRouter } from 'react-router'
import { AppRoutes } from './app/AppRoutes'
import { LocaleProvider } from './app/LocaleContext'

export default function App() {
  return (
    <LocaleProvider>
      <MotionConfig reducedMotion="user">
        {/* Commit every navigation in order: the landing and category screens track each category
            change, and transitions could merge a selection with an immediate history.back(). */}
        <HashRouter useTransitions={false}>
          <AppRoutes />
        </HashRouter>
      </MotionConfig>
    </LocaleProvider>
  )
}
