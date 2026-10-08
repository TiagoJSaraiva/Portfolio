import { useLocale } from '../../app/locale'
import { getSkills } from '../../data/portfolio'
import { LocalizedText } from '../../components/LocalizedText'
import { messages } from '../../data/messages'
import styles from './SkillList.module.css'

export function SkillList({ ids, selected }: { ids: string[]; selected: boolean }) {
  const { t } = useLocale()
  return (
    <section className={styles.section} aria-label={t(selected ? 'projectSkills' : 'skills')}>
      <LocalizedText
        className={`eyebrow ${styles.label}`}
        value={messages[selected ? 'projectSkills' : 'skills']}
      />
      <ul className={styles.list}>
        {getSkills(ids).map((skill) => (
          <li key={skill.id}>{skill.label}</li>
        ))}
      </ul>
    </section>
  )
}
