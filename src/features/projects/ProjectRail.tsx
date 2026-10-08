import { ArrowUpRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useLocale } from '../../app/locale'
import { ProjectImage } from '../../components/ProjectImage'
import { LocalizedText } from '../../components/LocalizedText'
import { messages } from '../../data/messages'
import type { CategoryId, Project } from '../../data/types'
import styles from './ProjectRail.module.css'

export function ProjectRail({
  projects,
  category,
  selectedId,
}: {
  projects: Project[]
  category: CategoryId
  selectedId?: string
}) {
  const { t } = useLocale()
  const [hovered, setHovered] = useState<string>()
  return (
    <section
      className={styles.section}
      data-horizontal={category === 'misc'}
      aria-label={t('selectedWork')}
    >
      <div className={styles.heading}>
        <LocalizedText className="eyebrow" value={messages.selectedWork} />
        <span>{String(projects.length).padStart(2, '0')}</span>
      </div>
      <motion.ul className={styles.list} layoutScroll>
        {projects.map((project, index) => (
          <motion.li
            key={project.id}
            layout="position"
            className={styles.item}
            data-expanded={hovered === project.id}
            data-selected={selectedId === project.id}
            onMouseEnter={() => setHovered(project.id)}
            onMouseLeave={() => setHovered(undefined)}
          >
            <Link
              to={`/${category}/${project.id}`}
              className={styles.card}
              aria-current={selectedId === project.id ? 'page' : undefined}
              onFocus={() => setHovered(project.id)}
              onBlur={() => setHovered(undefined)}
            >
              <ProjectImage project={project} className={styles.image} />
              <div className={styles.tint} />
              <div className={styles.content}>
                <span className={styles.number}>{String(index + 1).padStart(2, '0')}</span>
                <h3>
                  <LocalizedText value={project.title} />
                </h3>
                <ArrowUpRight size={16} className={styles.arrow} />
              </div>
              <p className={styles.summary}>
                <LocalizedText value={project.summary} variant="body" />
              </p>
            </Link>
          </motion.li>
        ))}
      </motion.ul>
      {!projects.length && (
        <p className={styles.empty}>
          <LocalizedText value={messages.empty} variant="body" />
        </p>
      )}
    </section>
  )
}
