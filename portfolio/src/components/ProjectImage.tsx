import { ImageOff } from 'lucide-react'
import { useState } from 'react'
import { useLocale } from '../app/locale'
import type { Project } from '../data/types'
import styles from './ProjectImage.module.css'

export function ProjectImage({
  project,
  className = '',
}: {
  project: Project
  className?: string
}) {
  const [failedSource, setFailedSource] = useState<string>()
  const { locale, t } = useLocale()
  if (!project.image || failedSource === project.image)
    return (
      <div className={`${styles.fallback} ${className}`} role="img" aria-label={t('missingImage')}>
        <ImageOff size={24} aria-hidden="true" />
        <span>{t('missingImage')}</span>
      </div>
    )
  return (
    <img
      className={className}
      src={project.image}
      alt={project.title[locale]}
      width="800"
      height="520"
      decoding="async"
      onError={() => setFailedSource(project.image)}
    />
  )
}
