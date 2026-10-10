import { ArrowUpRight } from 'lucide-react'
import { useMotionValue } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocale } from '../../app/locale'
import { CategoryIcon } from '../../components/CategoryIcon'
import { LocalizedText } from '../../components/LocalizedText'
import type { Category } from '../../data/types'
import type { LandingInteraction } from './useLandingInteraction'
import styles from './HomeSector.module.css'

export function HomeSector({
  category,
  index,
  selected,
  layer,
  interaction,
}: {
  category: Category
  index: number
  selected?: boolean
  layer: HTMLDivElement | null
  interaction: LandingInteraction
}) {
  const { locale } = useLocale()
  const iconRef = useRef<HTMLSpanElement>(null)
  const originRef = useRef<HTMLSpanElement>(null)
  const handleRef = useRef<HTMLSpanElement>(null)
  const sectorRef = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const [sectorHovered, setSectorHovered] = useState(false)
  const [ballHovered, setBallHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const { register } = interaction

  useLayoutEffect(() => {
    if (!originRef.current || !iconRef.current || !handleRef.current || !sectorRef.current) return
    return register(category.id, {
      origin: originRef.current,
      icon: iconRef.current,
      handle: handleRef.current,
      sector: sectorRef.current,
      x,
      y,
    })
  }, [category.id, layer, register, x, y])

  return (
    <>
      <button
        type="button"
        className={styles.sector}
        data-category={category.id}
        data-selected={selected || undefined}
        ref={sectorRef}
        onClick={() => interaction.select(category.id)}
        onPointerEnter={() => setSectorHovered(true)}
        onPointerLeave={() => setSectorHovered(false)}
        onFocus={(event) => setFocused(event.currentTarget.matches(':focus-visible'))}
        onKeyDown={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label={category.label[locale]}
      >
        <span className={styles.glow} aria-hidden="true" />
        <span className={styles.content}>
          <span
            className={styles.iconPlaceholder}
            ref={originRef}
            data-ball-origin
            aria-hidden="true"
          />
          <span className={styles.label}>
            <span>0{index + 1}</span>
            <span className={styles.title}>
              <LocalizedText value={category.label} />
            </span>
            <ArrowUpRight size={16} />
          </span>
          <span className={styles.tagline}>
            <LocalizedText value={category.tagline} variant="body" />
          </span>
        </span>
      </button>
      {layer &&
        createPortal(
          <span
            className={styles.ballPosition}
            ref={handleRef}
            data-category={category.id}
            data-ball-handle
            data-dragging={interaction.dragging === category.id || undefined}
            data-selected={selected || undefined}
            aria-hidden="true"
            onPointerDown={(event) => {
              setFocused(false)
              interaction.press(category.id, event)
            }}
            onPointerEnter={() => setBallHovered(true)}
            onPointerLeave={() => setBallHovered(false)}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
          >
            <span
              className={styles.icon}
              ref={iconRef}
              data-sector-icon
              data-highlight={sectorHovered || ballHovered || focused || undefined}
              data-focused={focused || undefined}
            >
              <span className={styles.ring} />
              <CategoryIcon category={category.id} size={42} />
            </span>
          </span>,
          layer,
        )}
    </>
  )
}
