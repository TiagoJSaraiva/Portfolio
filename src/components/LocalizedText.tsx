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

export function LocalizedText({
  value,
  className,
  variant = 'label',
  reveal = false,
}: {
  value: Localized
  className?: string
  variant?: 'label' | 'body'
  reveal?: boolean
}) {
  const { locale, transition } = useLocale()
  const text = value[locale]
  const phase =
    transition && value[transition.from] !== value[transition.to]
      ? transition.phase
      : reveal
        ? 'reveal'
        : undefined
  const segmenter = phase === 'reveal' && variant === 'label' ? getSegmenter() : undefined

  return (
    <span className={className} data-locale-phase={phase}>
      {phase === 'reveal' ? (
        <>
          <span className={styles.accessible}>{text}</span>
          <span aria-hidden="true" className={!segmenter ? styles.wholeText : undefined}>
            {segmenter
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
