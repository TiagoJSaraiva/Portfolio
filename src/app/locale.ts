import { createContext, useContext } from 'react'
import type { MessageKey } from '../data/messages'
import type { Locale } from '../data/types'

export interface LocaleTransition {
  from: Locale
  to: Locale
  phase: 'exit' | 'reveal'
}

export const localeExitMs = 150
export const localeRevealMs = 450

interface LocaleValue {
  locale: Locale
  transition: LocaleTransition | null
  finishLocaleTransition: () => void
  toggleLocale: () => void
  t: (key: MessageKey) => string
}
export const LocaleContext = createContext<LocaleValue | null>(null)

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used inside LocaleProvider')
  return context
}
