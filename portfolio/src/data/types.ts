export type Locale = 'en' | 'pt'
export type Localized<T = string> = Record<Locale, T>
export type CategoryId = 'games' | 'web' | 'misc'

export interface Skill {
  id: string
  label: string
}

export interface Category {
  id: CategoryId
  label: Localized
  tagline: Localized
  headline: Localized
  description: Localized<string[]>
  skillIds: string[]
}

export interface Project {
  id: string
  category: CategoryId
  title: Localized
  summary: Localized
  description: Localized<string[]>
  image?: string
  skillIds: string[]
  githubUrl?: string
  projectUrl?: string
  demo: boolean
  year: string
}

export interface Profile {
  name: string
  role: Localized
  invitation: Localized
  githubUrl?: string
  linkedinUrl?: string
}
