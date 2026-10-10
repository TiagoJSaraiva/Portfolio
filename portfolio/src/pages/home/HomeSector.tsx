import { ArrowUpRight } from 'lucide-react'
import { useLocale } from '../../app/locale'
import { CategoryIcon } from '../../components/CategoryIcon'
import { LocalizedText } from '../../components/LocalizedText'
import type { Category } from '../../data/types'
import styles from './HomeSector.module.css'

export function HomeSector({ category, index }: { category: Category; index: number }) {
  const { locale } = useLocale()
  return (
    <button
      type="button"
      className={styles.sector}
      data-category={category.id}
      aria-label={category.label[locale]}
    >
      <span className={styles.glow} aria-hidden="true" />
      <span className={styles.content}>
        <span className={styles.icon}>
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
