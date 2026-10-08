import { useParams } from 'react-router'
import { CategoryIcon } from '../../components/CategoryIcon'
import { Header } from '../../components/Header'
import { LocalizedText } from '../../components/LocalizedText'
import { messages } from '../../data/messages'
import { categories, copyrightYear, getCategory, getProjects, profile } from '../../data/portfolio'
import { JourneyPanel } from '../../features/journey/JourneyPanel'
import { ProjectRail } from '../../features/projects/ProjectRail'
import { SkillList } from '../../features/skills/SkillList'
import { NotFoundPage } from '../not-found/NotFoundPage'
import styles from './CategoryPage.module.css'

export function CategoryPage() {
  const { categoryId, projectId } = useParams()
  const category = getCategory(categoryId)
  if (!category) return <NotFoundPage />
  const projects = getProjects(category.id)
  const selected = projectId ? projects.find((project) => project.id === projectId) : undefined
  if (projectId && !selected) return <NotFoundPage />
  return (
    <div className={styles.page} data-category={category.id}>
      <Header category={category.id} />
      <main id="main-content" className={styles.main}>
        <div className={styles.intro}>
          <div className={styles.category}>
            <CategoryIcon category={category.id} size={18} />
            <LocalizedText className="eyebrow" value={category.label} />
            <span className={styles.index}>/ 0{categories.indexOf(category) + 1}</span>
          </div>
          <LocalizedText className={styles.tagline} value={category.tagline} variant="body" />
        </div>
        <div className={styles.layout} data-mode={category.id}>
          <div className={styles.skills}>
            <SkillList ids={selected?.skillIds ?? category.skillIds} selected={!!selected} />
          </div>
          <div className={styles.panel}>
            <JourneyPanel category={category} projects={projects} selected={selected} />
          </div>
          <div className={styles.rail}>
            <ProjectRail projects={projects} category={category.id} selectedId={selected?.id} />
          </div>
        </div>
        <footer className={styles.footer}>
          <LocalizedText value={messages.footer} variant="body" />
          <span>
            © {copyrightYear} {profile.name}
          </span>
        </footer>
      </main>
    </div>
  )
}
