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

export interface ProjectArtwork {
  background: string
  logo: string
}

export interface Project {
  id: string
  category: CategoryId
  title: Localized
  description: Localized<string[]>
  image?: ProjectArtwork
  skillIds: string[]
  github?: string
  access?: string
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
