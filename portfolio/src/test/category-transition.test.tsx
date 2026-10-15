import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { LocaleProvider } from '../app/LocaleContext'
import { messages } from '../data/messages'
import { projects } from '../data/portfolio'
import { ProjectCarousel } from '../features/journey/ProjectCarousel'
import { flight, iconTarget } from '../pages/home/homeTransition'

describe('distance-based flight', () => {
  it('accelerates, reaches its speed cap, and scales overshoot by peak speed', () => {
    const short = flight(40, false)
    const medium = flight(250, false)
    const long = flight(1500, false)
    expect(short.peakSpeed).toBeLessThan(medium.peakSpeed)
    expect(short.overshoot).toBeLessThan(medium.overshoot)
    expect(long.peakSpeed).toBe(1800)
    expect(long.duration).toBeGreaterThan(medium.duration)
    expect(medium.progress(0.5)).toBeLessThan(0.5)
    expect(long.progress(0)).toBe(0)
    expect(long.progress(1)).toBe(1)
    for (const mobile of [false, true]) {
      const target = iconTarget(mobile)
      expect(
        target.x - target.size / 2 - flight(10000, mobile).overshoot - 12,
      ).toBeGreaterThanOrEqual(0)
      expect(
        target.y - target.size / 2 - flight(10000, mobile).overshoot - 12,
      ).toBeGreaterThanOrEqual(0)
    }
  })
  it('handles an icon already at its destination', () => {
    const result = flight(0, false)
    expect(result.duration).toBe(0)
    expect(result.overshoot).toBe(0)
    expect(result.progress(1)).toBe(1)
  })
})

function renderTrail(items = projects.filter((project) => project.category === 'web')) {
  return render(
    <LocaleProvider>
      <MemoryRouter>
        <ProjectCarousel projects={items} panelRef={{ current: null }} presentation="trail" />
      </MemoryRouter>
    </LocaleProvider>,
  )
}

describe('project trail', () => {
  it('renders optional external links without internal project navigation or accessible duplicates', () => {
    const group = projects.filter((project) => project.category === 'games')
    renderTrail(group)
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4)
    expect(screen.getAllByRole('link')).toHaveLength(2)
    group.forEach((project) => {
      const visit = screen.queryByRole('link', {
        name: `${messages.visit.en} — ${project.title.en}`,
      })
      const github = screen.queryByRole('link', {
        name: `${messages.github.en} — ${project.title.en}`,
      })
      expect(!!visit).toBe(!!project.access)
      expect(!!github).toBe(!!project.github)
      for (const link of [visit, github])
        if (link) {
          expect(link).toHaveAttribute('target', '_blank')
          expect(link).toHaveAttribute('rel', 'noopener noreferrer')
          expect(link.getAttribute('href')).not.toMatch(/^#\//)
        }
    })
    expect(screen.getByRole('link', { name: 'Open project — Multiverse Heroes' })).toHaveAttribute(
      'href',
      'https://www.roblox.com/pt/games/82513593943496/Multiverse-Heroes',
    )
    expect(
      screen.getByRole('link', { name: 'View on GitHub — Multiverse Heroes' }),
    ).toHaveAttribute('href', 'https://github.com/TiagoJSaraiva/Roblox-Game')
    for (const link of document.querySelectorAll('[aria-hidden="true"] a'))
      expect(link).toHaveAttribute('tabindex', '-1')
  })
  it('supports each optional link combination', () => {
    const base = projects[0]!
    const combinations = [
      {
        ...base,
        id: 'both',
        github: 'https://github.com/example/repo',
        access: 'https://example.com',
      },
      {
        ...base,
        id: 'github-only',
        github: 'https://github.com/example/repo',
        access: undefined,
      },
      { ...base, id: 'access-only', github: undefined, access: 'https://example.com' },
      { ...base, id: 'none', github: undefined, access: undefined },
    ]
    const { container } = renderTrail(combinations)
    const cards = Array.from(container.querySelectorAll('article[data-project-id]')).slice(0, 4)
    expect(cards.map((card) => card.querySelectorAll('a').length)).toEqual([2, 1, 1, 0])
  })
  it('renders a localized empty state without controls', () => {
    renderTrail([])
    expect(screen.getByText(messages.empty.en)).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
  it('renders a single project with missing or broken artwork and no automatic movement', () => {
    const project = {
      ...projects[0]!,
      image: { background: '/broken-background.svg', logo: '/broken-logo.svg' },
    }
    renderTrail([project])
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: messages.pause.en })).not.toBeInTheDocument()
    fireEvent.error(document.querySelector('img[src="/broken-background.svg"]')!)
    expect(screen.getByRole('img', { name: messages.missingImage.en })).toBeInTheDocument()
  })
})
