import { ImageOff } from 'lucide-react'
import { useState } from 'react'
import { useLocale } from '../app/locale'
import type { Project } from '../data/types'
import { LocalizedText } from './LocalizedText'
import { messages } from '../data/messages'
import styles from './ProjectImage.module.css'

export function ProjectImage({
  project,
  className = '',
  backgroundClassName = '',
}: {
  project: Project
  className?: string
  backgroundClassName?: string
}) {
  const [failedSource, setFailedSource] = useState<string>()
  const { locale, t } = useLocale()
  const sourceKey = project.image
    ? `${project.image.background}\u0000${project.image.logo}`
    : undefined
  if (!project.image || failedSource === sourceKey)
    return (
      <div className={`${styles.fallback} ${className}`} role="img" aria-label={t('missingImage')}>
        <ImageOff size={24} aria-hidden="true" />
        <LocalizedText value={messages.missingImage} />
      </div>
    )
  return (
    <div className={`${styles.image} ${className}`} role="img" aria-label={project.title[locale]}>
      <img
        className={`${styles.background} ${backgroundClassName}`}
        src={project.image.background}
        alt=""
        width="800"
        height="520"
        decoding="async"
        onError={() => setFailedSource(sourceKey)}
      />
      <img
        className={styles.logo}
        src={project.image.logo}
        alt=""
        decoding="async"
        onError={() => setFailedSource(sourceKey)}
      />
    </div>
  )
}
