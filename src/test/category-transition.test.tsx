import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { LocaleProvider } from '../app/LocaleContext'
import { messages } from '../data/messages'
import { projects } from '../data/portfolio'
import { ProjectCarousel } from '../features/journey/ProjectCarousel'
import { clipToViewport, coverage, flight, iconTarget } from '../pages/home/homeTransition'
import type { SelectionGeometry } from '../pages/home/homeTransition'
import type { CategoryId } from '../data/types'

function desktopGeometry(category: CategoryId, scrolled = 0): SelectionGeometry {
  const scene = { left: 0, top: -scrolled, width: 1440, height: 900 }
  return {
    category,
    width: 1440,
    height: 900,
    mobile: false,
    pivot: { x: 720, y: 300 - scrolled },
    scene,
    sector: scene,
    icon: { left: 0, top: 0, width: 104, height: 104 },
    belt: { origin: { x: 0, y: 0 }, startTime: null },
  }
}

function vertices(path: string) {
  const values = path.match(/-?[\d.]+/g)!.map(Number)
  return values.flatMap((_, index) => (index % 2 ? [] : [[values[index], values[index + 1]]]))
}

function contains(polygon: number[][], [x, y]: number[]) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

describe('coverage surface', () => {
  const centers: Record<CategoryId, number[]> = {
    games: [331, 279],
    web: [1109, 279],
    misc: [720, 702],
  }

  it('stays inside the viewport so the coverage belt mask is screen-sized', () => {
    for (const category of ['games', 'web', 'misc'] as const) {
      for (const scrolled of [0, 400]) {
        for (const progress of [0, 0.25, 0.5, 0.9]) {
          for (const [x, y] of vertices(
            coverage(desktopGeometry(category, scrolled), progress).surface,
          )) {
            expect(x).toBeGreaterThanOrEqual(0)
            expect(x).toBeLessThanOrEqual(1440)
            expect(y).toBeGreaterThanOrEqual(0)
            expect(y).toBeLessThanOrEqual(900)
          }
        }
      }
    }
  })

  it('starts as the selected sector and ends as the whole screen', () => {
    for (const category of ['games', 'web', 'misc'] as const) {
      const start = vertices(coverage(desktopGeometry(category), 0).surface)
      for (const [id, center] of Object.entries(centers))
        expect(contains(start, center)).toBe(id === category)
      const almost = vertices(coverage(desktopGeometry(category), 0.97).surface)
      for (const center of Object.values(centers)) expect(contains(almost, center)).toBe(true)
      expect(coverage(desktopGeometry(category), 1).surface).toBe('M0 0H1440V900H0Z')
    }
  })

  it('clips polygons to the viewport edges', () => {
    const clipped = clipToViewport(
      [
        [-10, -10],
        [20, -10],
        [20, 20],
        [-10, 20],
      ],
      10,
      10,
    )
    // The starting vertex is irrelevant; the polygon must be exactly the viewport.
    expect(clipped).toHaveLength(4)
    expect(new Set(clipped.map(String))).toEqual(new Set(['0,0', '10,0', '10,10', '0,10']))
    expect(
      clipToViewport(
        [
          [20, 20],
          [30, 20],
          [30, 30],
        ],
        10,
        10,
      ),
    ).toEqual([])
  })
})

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
