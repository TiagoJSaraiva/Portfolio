import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { messages } from '../data/messages'
import type { Locale } from '../data/types'
import { LocaleContext } from './locale'

const storageKey = 'tiago-portfolio-locale'

function readLocale(): Locale {
  try {
    return localStorage.getItem(storageKey) === 'pt' ? 'pt' : 'en'
  } catch {
    return 'en'
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(readLocale)
  useEffect(() => {
    document.documentElement.lang = locale === 'pt' ? 'pt-BR' : 'en'
    try {
      localStorage.setItem(storageKey, locale)
    } catch {
      /* The interface works without persistent storage. */
    }
  }, [locale])
  return (
    <LocaleContext.Provider
      value={{
        locale,
        toggleLocale: () => setLocale((value) => (value === 'en' ? 'pt' : 'en')),
        t: (key) => messages[key][locale],
      }}
    >
      {children}
    </LocaleContext.Provider>
  )
}
