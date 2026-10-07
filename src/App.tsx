import { MotionConfig } from 'motion/react'
import { HashRouter } from 'react-router'
import { AppRoutes } from './app/AppRoutes'
import { LocaleProvider } from './app/LocaleContext'

export default function App() {
  return (
    <LocaleProvider>
      <MotionConfig reducedMotion="user">
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </MotionConfig>
    </LocaleProvider>
  )
}
