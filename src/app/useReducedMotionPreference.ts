import { useSyncExternalStore } from 'react'

const query = '(prefers-reduced-motion: reduce)'

// Reads the live preference; its change event may only arrive in a later frame.
export function prefersReducedMotion() {
  return window.matchMedia(query).matches
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(query)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

// Unlike Motion's initial preference snapshot, this also updates active carousels.
export function useReducedMotionPreference() {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false)
}
