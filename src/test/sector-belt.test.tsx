import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { categories } from '../data/portfolio'
import { readBelt } from '../pages/home/beltConfig'
import { beltMarks } from '../pages/home/beltIcons'
import { SectorBelt } from '../pages/home/SectorBelt'

const defaultMatchMedia = window.matchMedia

afterEach(() => {
  window.matchMedia = defaultMatchMedia
  window.history.replaceState(null, '', '/#/')
})

function renderLanding() {
  window.history.replaceState(null, '', '/#/')
  return render(<App />)
}

describe('belt sync', () => {
  it('measures the padding-box origin and the running animation start', () => {
    const sector = document.createElement('button')
    const belt = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    belt.setAttribute('data-sector-belt', '')
    sector.append(belt)
    sector.getBoundingClientRect = () =>
      DOMRect.fromRect({ x: 10, y: 200, width: 360, height: 200 })
    Object.defineProperty(sector, 'clientTop', { value: 1 })
    expect(readBelt(sector)).toEqual({ origin: { x: 10, y: 201 }, startTime: null })
    Object.assign(belt, { getAnimations: () => [{ startTime: 1234 }] })
    expect(readBelt(sector).startTime).toBe(1234)
  })
})

describe('sector belt', () => {
  it('repeats six monochrome marks per category in two offset rows', () => {
    for (const category of categories) {
      const { container, unmount } = render(<SectorBelt category={category.id} />)
      const belt = container.querySelector('[data-sector-belt]')
      expect(belt).toHaveAttribute('aria-hidden', 'true')
      const names = [...container.querySelectorAll('[data-belt-mark]')].map((mark) =>
        mark.getAttribute('data-belt-mark'),
      )
      expect(names).toHaveLength(12)
      expect(new Set(names)).toEqual(new Set(beltMarks[category.id].map((mark) => mark.name)))
      for (const element of container.querySelectorAll('[data-belt-mark] *')) {
        for (const attribute of ['fill', 'stroke']) {
          const value = element.getAttribute(attribute)
          if (value) expect(['currentColor', 'none']).toContain(value)
        }
      }
      unmount()
    }
  })

  it('anchors the repeating pattern to the given origin', () => {
    const { container } = render(<SectorBelt category="web" origin={{ x: 4, y: 120 }} />)
    const pattern = container.querySelector('pattern')
    expect(pattern).toHaveAttribute('x', '4')
    expect(pattern).toHaveAttribute('y', '120')
    expect(container.querySelector('rect')?.getAttribute('fill')).toBe(`url(#${pattern?.id})`)
  })
})

describe('landing belts', () => {
  it('decorates each sector without adding accessible names or controls', () => {
    renderLanding()
    for (const category of categories) {
      const sector = screen.getByRole('button', { name: category.label.en })
      expect(sector.querySelectorAll('[data-sector-belt]')).toHaveLength(1)
    }
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('continues the selected belt inside the growing coverage', () => {
    renderLanding()
    fireEvent.click(screen.getByRole('button', { name: categories[1].label.en }))
    const belt = document.querySelector('[data-coverage-belt]')
    expect(belt).toHaveAttribute('data-category', categories[1].id)
    expect(belt?.querySelectorAll('[data-sector-belt]')).toHaveLength(1)
  })

  it('skips the coverage belt with reduced motion', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    renderLanding()
    fireEvent.click(screen.getByRole('button', { name: categories[0].label.en }))
    expect(document.querySelector('[data-coverage-belt]')).not.toBeInTheDocument()
  })
})
