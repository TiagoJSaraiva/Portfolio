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
import { categories, profile, projects, skills } from '../data/portfolio'
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
    expect(messages.footer).toEqual({ en: '', pt: '' })
    for (const [key, message] of Object.entries(messages)) {
      if (key === 'footer') continue
      expect(message.en).toBeTruthy()
      expect(message.pt).toBeTruthy()
    }
  })
})

describe('landing-only navigation', () => {
  it('keeps the three category buttons inert', async () => {
    const user = userEvent.setup()
    renderApp('/')
    for (const category of categories) {
      await user.click(screen.getByRole('button', { name: category.label.en }))
      expect(window.location.hash).toBe('#/')
    }
    expect(screen.getByRole('heading', { level: 1, name: profile.name })).toBeInTheDocument()
  })

  it.each(['/other', '/games/unknown', '/web/orbit', '/games/orbit/extra'])(
    'redirects old route %s to the landing page',
    async (route) => {
      renderApp(route)
      expect(
        await screen.findByRole('heading', { level: 1, name: profile.name }),
      ).toBeInTheDocument()
      await waitFor(() => expect(window.location.hash).toBe('#/'))
    },
  )
})

describe('project components', () => {
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
    const project = { ...projects[0]!, image: '/broken-image.svg' }
    render(
      <LocaleProvider>
        <ProjectImage project={project} />
      </LocaleProvider>,
    )
    fireEvent.error(screen.getByRole('img', { name: projects[0]!.title.en }))
    expect(screen.getByRole('img', { name: 'Preview coming soon' })).toBeInTheDocument()
  })

  it('shows only the landing header controls', () => {
    render(
      <LocaleProvider>
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      </LocaleProvider>,
    )
    expect(screen.queryByRole('navigation', { name: 'Explore other categories' })).toBeNull()
    expect(screen.getByRole('link', { name: /Tiago Saraiva/ })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('link', { name: 'LinkedIn' })).not.toBeInTheDocument()
  })
})

describe('language', () => {
  it('starts in English and translates the landing page without changing the URL', async () => {
    const user = userEvent.setup()
    renderApp('/')
    expect(screen.getByRole('heading', { level: 1, name: profile.name })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
    await user.click(screen.getByRole('button', { name: 'Change language to Portuguese' }))
    expect(await screen.findByText(profile.invitation.pt)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: profile.name })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('pt-BR')
    expect(localStorage.getItem('tiago-portfolio-locale')).toBe('pt')
    expect(window.location.hash).toBe('#/')
  })

  it('keeps EN and PT in a fixed order while active emphasis follows the locale', async () => {
    const user = userEvent.setup()
    render(
      <LocaleProvider>
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      </LocaleProvider>,
    )

    const englishButton = screen.getByRole('button', { name: 'Change language to Portuguese' })
    const codes = within(englishButton).getAllByText(/^(EN|PT)$/)
    expect(codes.map((code) => code.textContent)).toEqual(['EN', 'PT'])
    expect(codes.map((code) => code.getAttribute('data-active'))).toEqual(['true', 'false'])

    await user.click(englishButton)
    expect(codes.map((code) => code.textContent)).toEqual(['EN', 'PT'])
    expect(codes.map((code) => code.getAttribute('data-active'))).toEqual(['false', 'true'])
    expect(localStorage.getItem('tiago-portfolio-locale')).toBe('pt')

    const portugueseButton = await screen.findByRole('button', { name: 'Mudar idioma para inglês' })
    await waitFor(() => expect(portugueseButton).not.toHaveAttribute('aria-disabled'))
    await user.click(portugueseButton)
    expect(codes.map((code) => code.getAttribute('data-active'))).toEqual(['true', 'false'])
    expect(localStorage.getItem('tiago-portfolio-locale')).toBe('en')
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
