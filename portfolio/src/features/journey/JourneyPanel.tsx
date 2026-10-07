import { ArrowDownRight, ArrowLeft, ArrowUpRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useRef } from 'react'
import { Link } from 'react-router'
import { useLocale } from '../../app/locale'
import { ProjectImage } from '../../components/ProjectImage'
import { GithubIcon } from '../../components/BrandIcons'
import type { Category, Project } from '../../data/types'
import { ProjectCarousel } from './ProjectCarousel'
import styles from './JourneyPanel.module.css'

export function JourneyPanel({
  category,
  projects,
  selected,
}: {
  category: Category
  projects: Project[]
  selected?: Project
}) {
  const { locale, t } = useLocale()
  const panelRef = useRef<HTMLDivElement>(null)
  return (
    <motion.div ref={panelRef} className={styles.panel} layout="position">
      {selected ? (
        <motion.article
          key={selected.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={styles.project}
        >
          <div className={styles.projectTop}>
            <Link to={`/${category.id}`} className={styles.back}>
              <ArrowLeft size={14} />
              {t('back')}
            </Link>
            <span className={styles.year}>{selected.year}</span>
          </div>
          <div className={styles.story}>
            <ProjectImage project={selected} className={styles.projectImage} />
            {selected.demo && <span className={`eyebrow ${styles.demo}`}>{t('demo')}</span>}
            <h1 tabIndex={-1} data-page-heading>
              {selected.title[locale]}
            </h1>
            {selected.description[locale].map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          {selected.demo && <p className={styles.note}>{t('demoNote')}</p>}
          {(selected.githubUrl || selected.projectUrl) && (
            <div className={styles.actions}>
              {selected.githubUrl && (
                <a href={selected.githubUrl} target="_blank" rel="noopener noreferrer">
                  <GithubIcon size={16} />
                  {t('github')}
                  <ArrowUpRight size={14} />
                </a>
              )}
              {selected.projectUrl && (
                <a
                  href={selected.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.primary}
                >
                  {t('visit')}
                  <ArrowUpRight size={16} />
                </a>
              )}
            </div>
          )}
        </motion.article>
      ) : (
        <>
          <ProjectCarousel projects={projects} panelRef={panelRef} />
          <motion.article
            key={category.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.journey}
          >
            <span className={`eyebrow ${styles.eyebrow}`}>
              <span className={styles.dot} />
              {t('journey')}
            </span>
            <h1 tabIndex={-1} data-page-heading>
              {category.headline[locale]}
            </h1>
            <div className={styles.description}>
              {category.description[locale].map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <div className={styles.bottom}>
              <span>{category.tagline[locale]}</span>
              <ArrowDownRight size={24} strokeWidth={1} />
            </div>
          </motion.article>
        </>
      )}
    </motion.div>
  )
}
