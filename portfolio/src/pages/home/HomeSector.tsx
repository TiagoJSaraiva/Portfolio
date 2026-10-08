import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { useLocale } from '../../app/locale'
import { CategoryIcon } from '../../components/CategoryIcon'
import { LocalizedText } from '../../components/LocalizedText'
import type { Category } from '../../data/types'
import styles from './HomeSector.module.css'

export function HomeSector({ category, index }: { category: Category; index: number }) {
  const { locale } = useLocale()
  return (
    <Link
      to={`/${category.id}`}
      className={styles.sector}
      data-category={category.id}
      aria-label={category.label[locale]}
    >
      <div className={styles.glow} />
      <div className={styles.content}>
        <div className={styles.icon}>
          <div className={styles.ring} />
          <CategoryIcon category={category.id} size={42} />
        </div>
        <div className={styles.label}>
          <span>0{index + 1}</span>
          <h2>
            <LocalizedText value={category.label} />
          </h2>
          <ArrowUpRight size={16} />
        </div>
        <p>
          <LocalizedText value={category.tagline} variant="body" />
        </p>
      </div>
    </Link>
  )
}
