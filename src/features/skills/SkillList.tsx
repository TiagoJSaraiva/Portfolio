import { useLocale } from '../../app/locale'
import { getSkills } from '../../data/portfolio'
import styles from './SkillList.module.css'

export function SkillList({ ids, selected }: { ids: string[]; selected: boolean }) {
  const { t } = useLocale()
  return (
    <section className={styles.section} aria-label={t(selected ? 'projectSkills' : 'skills')}>
      <span className={`eyebrow ${styles.label}`}>{t(selected ? 'projectSkills' : 'skills')}</span>
      <ul className={styles.list}>
        {getSkills(ids).map((skill) => (
          <li key={skill.id}>{skill.label}</li>
        ))}
      </ul>
    </section>
  )
}
