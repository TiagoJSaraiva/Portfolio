import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { getProjects, projects } from '../data/portfolio'
import { preloadProjectImages } from '../features/projects/preloadProjectImages'

function captureImageRequests() {
  const sources: string[] = []
  vi.spyOn(HTMLImageElement.prototype, 'src', 'set').mockImplementation((value: string) => {
    sources.push(value)
  })
  return sources
}

afterEach(() => {
  window.history.replaceState(null, '', '/#/')
})

describe('project image preloading', () => {
  it('requests every background and logo once and skips projects without artwork', () => {
    const sources = captureImageRequests()
    const base = projects[0]!
    preloadProjectImages([
      { ...base, id: 'both', image: { background: '/bg.png', logo: '/logo.png' } },
      { ...base, id: 'background-only', image: { background: '/only.png' } },
      { ...base, id: 'none', image: undefined },
    ])
    expect(sources).toEqual(['/bg.png', '/logo.png', '/only.png'])
  })

  it('starts loading the selected category artwork when it is chosen on the landing', async () => {
    const user = userEvent.setup()
    window.history.replaceState(null, '', '/#/')
    render(<App />)
    const sources = captureImageRequests()
    await user.click(screen.getByRole('button', { name: 'Games' }))
    const expected = getProjects('games').flatMap(({ image }) =>
      image ? [image.background, image.logo].filter((source) => source !== undefined) : [],
    )
    expect(expected.length).toBeGreaterThan(0)
    expect(sources).toEqual(expect.arrayContaining(expected))
  })
})
