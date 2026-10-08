import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { messages } from '../data/messages'
import type { Locale } from '../data/types'
import { LocaleContext, localeExitMs, localeRevealMs } from './locale'
import type { LocaleTransition } from './locale'

const storageKey = 'tiago-portfolio-locale'

function readLocale(): Locale {
  try {
    return localStorage.getItem(storageKey) === 'pt' ? 'pt' : 'en'
  } catch {
    return 'en'
  }
}

function persistLocale(locale: Locale) {
  try {
    localStorage.setItem(storageKey, locale)
  } catch {
    /* The interface works without persistent storage. */
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(readLocale)
  const [transition, setTransition] = useState<LocaleTransition | null>(null)
  const currentLocale = useRef(locale)
  const pending = useRef<LocaleTransition | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const finishLocaleTransition = useCallback(() => {
    const active = pending.current
    if (!active) return
    timers.current.forEach(clearTimeout)
    timers.current = []
    pending.current = null
    currentLocale.current = active.to
    setLocale(active.to)
    setTransition(null)
  }, [])

  const toggleLocale = useCallback(() => {
    // Guard the callback too: aria-disabled preserves keyboard focus.
    if (pending.current) return
    const from = currentLocale.current
    const to = from === 'en' ? 'pt' : 'en'
    persistLocale(to)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      currentLocale.current = to
      setLocale(to)
      return
    }
    const active: LocaleTransition = { from, to, phase: 'exit' }
    pending.current = active
    setTransition(active)
  }, [])

  useEffect(() => {
    if (!transition) return
    // Each clock starts after its phase is committed. There is one shared
    // timer, never a timer or a React update for each letter.
    const timer = setTimeout(
      transition.phase === 'exit'
        ? () => {
            currentLocale.current = transition.to
            setLocale(transition.to)
            const reveal: LocaleTransition = { ...transition, phase: 'reveal' }
            pending.current = reveal
            setTransition(reveal)
          }
        : finishLocaleTransition,
      transition.phase === 'exit' ? localeExitMs : localeRevealMs,
    )
    timers.current = [timer]
    return () => clearTimeout(timer)
  }, [transition, finishLocaleTransition])

  useEffect(() => {
    document.documentElement.lang = locale === 'pt' ? 'pt-BR' : 'en'
  }, [locale])
  useEffect(() => {
    persistLocale(currentLocale.current)
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => {
      if (media.matches) finishLocaleTransition()
    }
    media.addEventListener('change', onChange)
    return () => {
      media.removeEventListener('change', onChange)
      timers.current.forEach(clearTimeout)
      timers.current = []
      pending.current = null
    }
  }, [finishLocaleTransition])
  return (
    <LocaleContext.Provider
      value={{
        locale,
        transition,
        finishLocaleTransition,
        toggleLocale,
        t: (key) => messages[key][locale],
      }}
    >
      {children}
    </LocaleContext.Provider>
  )
}
