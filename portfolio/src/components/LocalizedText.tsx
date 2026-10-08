import type { CSSProperties } from 'react'
import { useLocale, localeExitMs, localeRevealMs } from '../app/locale'
import type { Localized } from '../data/types'
import styles from './LocalizedText.module.css'

let graphemeSegmenter: Intl.Segmenter | undefined

function getSegmenter() {
  if (typeof Intl.Segmenter !== 'function') return undefined
  graphemeSegmenter ??= new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  return graphemeSegmenter
}

function isLongParagraph(text: string, segmenter: Intl.Segmenter) {
  const graphemes = segmenter.segment(text)[Symbol.iterator]()
  // Stop at the threshold; long paragraphs never allocate per-letter arrays.
  for (let count = 0; count < 140; count++) {
    if (graphemes.next().done) return false
  }
  return true
}

export function LocalizedText({
  value,
  className,
  paragraph = false,
}: {
  value: Localized
  className?: string
  paragraph?: boolean
}) {
  const { locale, transition } = useLocale()
  const text = value[locale]
  const phase =
    transition && value[transition.from] !== value[transition.to] ? transition.phase : undefined
  const segmenter = phase === 'reveal' ? getSegmenter() : undefined
  const revealLetters = segmenter && !(paragraph && isLongParagraph(text, segmenter))

  return (
    <span className={className} data-locale-phase={phase}>
      {phase === 'reveal' ? (
        <>
          <span className={styles.accessible}>{text}</span>
          <span aria-hidden="true" className={!revealLetters ? styles.fallback : undefined}>
            {revealLetters
              ? text.split(/(\s+)/u).map((word, wordIndex) => {
                  if (!word || /^\s+$/u.test(word)) return word
                  const letters = Array.from(segmenter.segment(word), (part) => part.segment)
                  const duration = letters.length === 1 ? localeRevealMs : localeExitMs
                  return letters.map((letter, index) => (
                    <span
                      key={`${wordIndex}-${index}`}
                      className={styles.letter}
                      data-locale-letter
                      style={
                        {
                          '--letter-duration': `${duration}ms`,
                          '--letter-delay': `${letters.length === 1 ? 0 : (index * (localeRevealMs - duration)) / (letters.length - 1)}ms`,
                        } as CSSProperties
                      }
                    >
                      {letter}
                    </span>
                  ))
                })
              : text}
          </span>
        </>
      ) : (
        text
      )}
    </span>
  )
}
