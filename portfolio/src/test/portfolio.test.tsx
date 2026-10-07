import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'motion/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { LocaleProvider } from '../app/LocaleContext'
import { useLocale } from '../app/locale'
import { Header } from '../components/Header'
import { ProjectImage } from '../components/ProjectImage'
import { categories, projects, skills } from '../data/portfolio'
import { messages } from '../data/messages'
import { JourneyPanel } from '../features/journey/JourneyPanel'
import { ProjectRail } from '../features/projects/ProjectRail'

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/#/')
})

function renderApp(route: string) {
  window.history.replaceState(null, '', `/#${route}`)
  return render(<App />)
}

function Probe() {
  const { locale, toggleLocale } = useLocale()
  return <button onClick={toggleLocale}>{locale}</button>
}

describe('content contract', () => {
  it('has twelve unique projects with translated content and valid skills', () => {
    expect(projects).toHaveLength(12)
    expect(new Set(projects.map((project) => project.id)).size).toBe(12)
    for (const project of projects) {
      expect(project.image).toBeTruthy()
      expect(project.title.en).toBeTruthy()
      expect(project.title.pt).toBeTruthy()
      expect(project.description.en.length).toBeGreaterThan(0)
      expect(project.description.pt.length).toBeGreaterThan(0)
      expect(project.skillIds.every((id) => skills.some((skill) => skill.id === id))).toBe(true)
    }
    for (const category of categories) {
      const group = projects.filter((project) => project.category === category.id)
      expect(group.map((project) => [!!project.githubUrl, !!project.projectUrl])).toEqual([
        [true, true],
        [true, false],
        [false, true],
        [false, false],
      ])
    }
    for (const message of Object.values(messages)) {
      expect(message.en).toBeTruthy()
      expect(message.pt).toBeTruthy()
    }
  })
})

describe('project behavior', () => {
  it.each(
    projects.map(
      (project) =>
        [project.category, project.id, !!project.githubUrl, !!project.projectUrl] as const,
    ),
  )('renders only available links for %s/%s', (_category, id, hasGithub, hasProject) => {
    renderApp(`/${_category}/${id}`)
    expect(!!screen.queryByRole('link', { name: 'View on GitHub' })).toBe(hasGithub)
    expect(!!screen.queryByRole('link', { name: 'Open project' })).toBe(hasProject)
    if (hasGithub)
      expect(screen.getByRole('link', { name: 'View on GitHub' })).toHaveAttribute(
        'href',
        'https://github.com/TiagoJSaraiva/Portfolio',
      )
    if (hasProject)
      expect(screen.getByRole('link', { name: 'Open project' })).toHaveAttribute(
        'href',
        'https://www.youtube.com',
      )
  })

  it('opens a project from the rail, changes skills, and returns to the journey', async () => {
    const user = userEvent.setup()
    renderApp('/games')
    const rail = screen.getByRole('region', { name: 'Selected work' })
    await user.click(within(rail).getByRole('link', { name: /Orbit/ }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Orbit' })).toBeInTheDocument()
    expect(window.location.hash).toBe('#/games/orbit')
    expect(screen.getByRole('region', { name: 'Built with' })).toHaveTextContent('Luau')
    expect(screen.getByRole('region', { name: 'Built with' })).not.toHaveTextContent('TypeScript')
    await user.click(screen.getByRole('link', { name: 'Back to the journey' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: /Little worlds/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Tools of the trade' })).toHaveTextContent(
      'TypeScript',
    )
  })

  it.each(['/other', '/games/unknown', '/web/orbit', '/games/orbit/extra'])(
    'handles invalid route %s',
    (route) => {
      renderApp(route)
      expect(screen.getByRole('heading', { level: 1, name: 'A small detour.' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '#/')
    },
  )

  it('handles an empty category without a carousel', () => {
    render(
      <LocaleProvider>
        <MotionConfig reducedMotion="always">
          <MemoryRouter>
            <ProjectRail projects={[]} category="games" />
            <JourneyPanel projects={[]} category={categories[0]!} />
          </MemoryRouter>
        </MotionConfig>
      </LocaleProvider>,
    )
    expect(screen.getByText(messages.empty.en)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next projects' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders long content in full and handles missing or broken images', () => {
    const longText = 'A long story. '.repeat(1000)
    const project = {
      ...projects[0]!,
      description: { en: [longText], pt: [longText] },
      image: undefined,
    }
    render(
      <LocaleProvider>
        <MemoryRouter>
          <JourneyPanel projects={[project]} category={categories[0]!} selected={project} />
        </MemoryRouter>
      </LocaleProvider>,
    )
    expect(screen.getByText(longText.trim())).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Preview coming soon' })).toBeInTheDocument()
  })

  it('replaces a failing image with a localized fallback', () => {
    render(
      <LocaleProvider>
        <ProjectImage project={projects[0]!} />
      </LocaleProvider>,
    )
    fireEvent.error(screen.getByRole('img', { name: 'Orbit' }))
    expect(screen.getByRole('img', { name: 'Preview coming soon' })).toBeInTheDocument()
  })

  it('shows exactly the other two categories in the header', () => {
    render(
      <LocaleProvider>
        <MemoryRouter>
          <Header category="games" />
        </MemoryRouter>
      </LocaleProvider>,
    )
    const navigation = screen.getByRole('navigation', { name: 'Explore other categories' })
    expect(within(navigation).getAllByRole('link')).toHaveLength(2)
    expect(within(navigation).getByRole('link', { name: 'Web' })).toBeInTheDocument()
    expect(within(navigation).getByRole('link', { name: 'Misc' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'LinkedIn' })).not.toBeInTheDocument()
  })
})

describe('language', () => {
  it('starts in English and translates the selected project without changing the URL', async () => {
    const user = userEvent.setup()
    renderApp('/games/orbit')
    expect(document.documentElement.lang).toBe('en')
    await user.click(screen.getByRole('button', { name: 'Change language to Portuguese' }))
    expect(screen.getByRole('link', { name: 'Voltar à trajetória' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver no GitHub' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('pt-BR')
    expect(localStorage.getItem('tiago-portfolio-locale')).toBe('pt')
    expect(window.location.hash).toBe('#/games/orbit')
  })

  it('restores a saved locale and ignores invalid saved values', () => {
    localStorage.setItem('tiago-portfolio-locale', 'pt')
    const first = render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    )
    expect(screen.getByRole('button', { name: 'pt' })).toBeInTheDocument()
    first.unmount()
    localStorage.setItem('tiago-portfolio-locale', 'invalid')
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    )
    expect(screen.getByRole('button', { name: 'en' })).toBeInTheDocument()
  })

  it('remains usable when localStorage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage blocked')
    })
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'en' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'pt' })).toBeInTheDocument())
  })
})
