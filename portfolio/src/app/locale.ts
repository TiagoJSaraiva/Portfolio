import { createContext, useContext } from 'react'
import type { MessageKey } from '../data/messages'
import type { Locale } from '../data/types'

interface LocaleValue {
  locale: Locale
  toggleLocale: () => void
  t: (key: MessageKey) => string
}
export const LocaleContext = createContext<LocaleValue | null>(null)

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used inside LocaleProvider')
  return context
}
