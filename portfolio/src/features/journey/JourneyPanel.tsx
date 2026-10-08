import { ArrowDownRight, ArrowLeft, ArrowUpRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useRef } from 'react'
import { Link } from 'react-router'
import { useLocale } from '../../app/locale'
import { ProjectImage } from '../../components/ProjectImage'
import { GithubIcon } from '../../components/BrandIcons'
import { LocalizedText } from '../../components/LocalizedText'
import { messages } from '../../data/messages'
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
  const { locale } = useLocale()
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
              <LocalizedText value={messages.back} />
            </Link>
            <span className={styles.year}>{selected.year}</span>
          </div>
          <div className={styles.story}>
            <ProjectImage project={selected} className={styles.projectImage} />
            {selected.demo && (
              <LocalizedText className={`eyebrow ${styles.demo}`} value={messages.demo} />
            )}
            <h1 tabIndex={-1} data-page-heading aria-label={selected.title[locale]}>
              <LocalizedText value={selected.title} />
            </h1>
            {selected.description[locale].map((_, index) => (
              <p key={index}>
                <LocalizedText
                  paragraph
                  value={{
                    en: selected.description.en[index] ?? '',
                    pt: selected.description.pt[index] ?? '',
                  }}
                />
              </p>
            ))}
          </div>
          {selected.demo && (
            <p className={styles.note}>
              <LocalizedText value={messages.demoNote} paragraph />
            </p>
          )}
          {(selected.githubUrl || selected.projectUrl) && (
            <div className={styles.actions}>
              {selected.githubUrl && (
                <a href={selected.githubUrl} target="_blank" rel="noopener noreferrer">
                  <GithubIcon size={16} />
                  <LocalizedText value={messages.github} />
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
                  <LocalizedText value={messages.visit} />
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
              <LocalizedText value={messages.journey} />
            </span>
            <h1 tabIndex={-1} data-page-heading aria-label={category.headline[locale]}>
              <LocalizedText value={category.headline} />
            </h1>
            <div className={styles.description}>
              {category.description[locale].map((_, index) => (
                <p key={index}>
                  <LocalizedText
                    paragraph
                    value={{
                      en: category.description.en[index] ?? '',
                      pt: category.description.pt[index] ?? '',
                    }}
                  />
                </p>
              ))}
            </div>
            <div className={styles.bottom}>
              <LocalizedText value={category.tagline} />
              <ArrowDownRight size={24} strokeWidth={1} />
            </div>
          </motion.article>
        </>
      )}
    </motion.div>
  )
}
