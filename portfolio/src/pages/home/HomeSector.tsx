import { ArrowUpRight } from 'lucide-react'
import { useRef } from 'react'
import { useLocale } from '../../app/locale'
import { CategoryIcon } from '../../components/CategoryIcon'
import { LocalizedText } from '../../components/LocalizedText'
import type { Category } from '../../data/types'
import styles from './HomeSector.module.css'

export function HomeSector({
  category,
  index,
  selected,
  onSelect,
}: {
  category: Category
  index: number
  selected?: boolean
  onSelect: (category: Category['id'], icon: HTMLSpanElement, sector: HTMLButtonElement) => void
}) {
  const { locale } = useLocale()
  const iconRef = useRef<HTMLSpanElement>(null)
  return (
    <button
      type="button"
      className={styles.sector}
      data-category={category.id}
      data-selected={selected || undefined}
      onClick={(event) => {
        if (iconRef.current) onSelect(category.id, iconRef.current, event.currentTarget)
      }}
      aria-label={category.label[locale]}
    >
      <span className={styles.glow} aria-hidden="true" />
      <span className={styles.content}>
        <span className={styles.icon} ref={iconRef} data-sector-icon>
          <span className={styles.ring} />
          <CategoryIcon category={category.id} size={42} />
        </span>
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
  )
}
