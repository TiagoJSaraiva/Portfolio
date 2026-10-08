import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { LocaleProvider } from '../app/LocaleContext'
import { localeExitMs, localeRevealMs, useLocale } from '../app/locale'
import { Header } from '../components/Header'
import { LocalizedText } from '../components/LocalizedText'
import { messages } from '../data/messages'
import { categories, projects } from '../data/portfolio'
import type { Localized } from '../data/types'
import { JourneyPanel } from '../features/journey/JourneyPanel'
import { ProjectRail } from '../features/projects/ProjectRail'

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/#/')
  vi.useFakeTimers()
  mediaPreference()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
function advance(ms: number) {
  act(() => vi.advanceTimersByTime(ms))
}

function mediaPreference(initial = false) {
  let reduced = initial
  const media = new EventTarget() as MediaQueryList
  Object.defineProperties(media, {
    matches: { get: () => reduced },
    media: { value: '(prefers-reduced-motion: reduce)' },
  })
  media.addListener = vi.fn()
  media.removeListener = vi.fn()
  vi.spyOn(window, 'matchMedia').mockReturnValue(media)
  return (value: boolean) =>
    act(() => {
      reduced = value
      media.dispatchEvent(Object.assign(new Event('change'), { matches: value }))
    })
}

const copy: Localized = { en: 'English words.', pt: 'a ação\n👩🏽‍💻 cafe\u0301!' }
function TextProbe({ value = copy }: { value?: Localized }) {
  const { locale, transition, finishLocaleTransition } = useLocale()
  return (
    <>
      <Header />
      <h1>
        <LocalizedText value={value} />
      </h1>
      <p>
        <LocalizedText value={{ en: 'React', pt: 'React' }} />
      </p>
      <p>
        <LocalizedText value={{ en: '', pt: '' }} />
      </p>
      <output>
        {locale}/{transition?.phase ?? 'idle'}
      </output>
      <button onClick={finishLocaleTransition}>Finish</button>
    </>
  )
}
function renderProbe(value?: Localized) {
  return render(
    <LocaleProvider>
      <MemoryRouter>
        <TextProbe value={value} />
      </MemoryRouter>
    </LocaleProvider>,
  )
}
function toggle() {
  fireEvent.click(screen.getByRole('button', { name: /Change language|Mudar idioma/ }))
}

describe('coordinated locale transition', () => {
  it('fades the old text, reveals accessible words with intact graphemes and cleans up', () => {
    renderProbe()
    const button = screen.getByRole('button', { name: messages.language.en })
    button.focus()
    expect(document.querySelector('[data-locale-phase]')).toBeNull()
    toggle()
    expect(screen.getByRole('heading')).toHaveTextContent(copy.en)
    expect(screen.getByRole('heading').firstElementChild).toHaveAttribute(
      'data-locale-phase',
      'exit',
    )
    expect(screen.getByText('React')).not.toHaveAttribute('data-locale-phase')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toHaveFocus()
    expect(localStorage.getItem('tiago-portfolio-locale')).toBe('pt')
    expect(document.documentElement.lang).toBe('en')
    advance(localeExitMs - 1)
    expect(document.querySelector('[data-locale-letter]')).toBeNull()
    advance(1)
    expect(document.documentElement.lang).toBe('pt-BR')
    expect(screen.getByRole('heading')).toHaveAccessibleName(/^a ação\s+👩🏽‍💻 cafe\u0301!$/u)
    const letters = Array.from(document.querySelectorAll<HTMLElement>('[data-locale-letter]'))
    expect(letters.map((letter) => letter.textContent)).toEqual([
      'a',
      'a',
      'ç',
      'ã',
      'o',
      '👩🏽‍💻',
      'c',
      'a',
      'f',
      'e\u0301',
      '!',
    ])
    expect(letters[0]!.style.getPropertyValue('--letter-duration')).toBe('450ms')
    for (const index of [1, 6])
      expect(letters[index]!.style.getPropertyValue('--letter-delay')).toBe('0ms')
    for (const index of [4, 10])
      expect(letters[index]!.style.getPropertyValue('--letter-delay')).toBe('300ms')
    expect(letters[0]!.parentElement).toHaveAttribute('aria-hidden', 'true')
    expect(letters[0]!.parentElement!.textContent).toBe(copy.pt)
    advance(localeRevealMs - 1)
    expect(button).toHaveAttribute('aria-disabled', 'true')
    advance(1)
    expect(document.querySelector('[data-locale-letter]')).toBeNull()
    expect(document.querySelector('[data-locale-phase]')).toBeNull()
    expect(screen.getByRole('heading').textContent).toBe(copy.pt)
    expect(button).not.toHaveAttribute('aria-disabled')
    expect(button).toHaveFocus()
  })
  it('ignores repeated activations until the effect finishes', () => {
    renderProbe()
    toggle()
    toggle()
    expect(localStorage.getItem('tiago-portfolio-locale')).toBe('pt')
    advance(localeExitMs)
    toggle()
    expect(screen.getByText('pt/reveal')).toBeInTheDocument()
    advance(localeRevealMs)
    toggle()
    expect(screen.getByText('pt/exit')).toBeInTheDocument()
    expect(localStorage.getItem('tiago-portfolio-locale')).toBe('en')
    advance(localeExitMs)
    advance(localeRevealMs)
    expect(screen.getByText('en/idle')).toBeInTheDocument()
  })
  it.each([0, localeExitMs])('finishes safely when interrupted after %i ms', (time) => {
    renderProbe()
    toggle()
    if (time) advance(time)
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }))
    expect(screen.getByText('pt/idle')).toBeInTheDocument()
    expect(vi.getTimerCount()).toBe(0)
    advance(1000)
    expect(screen.getByText('pt/idle')).toBeInTheDocument()
  })
  it('restores a saved locale without animation and works with blocked storage', () => {
    localStorage.setItem('tiago-portfolio-locale', 'pt')
    const first = renderProbe()
    expect(screen.getByText('pt/idle')).toBeInTheDocument()
    expect(document.querySelector('[data-locale-phase]')).toBeNull()
    first.unmount()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Blocked')
    })
    renderProbe()
    toggle()
    advance(localeExitMs)
    advance(localeRevealMs)
    expect(screen.getByText('pt/idle')).toBeInTheDocument()
  })
  it('switches immediately with reduced motion, including a preference change mid-effect', () => {
    const reduce = mediaPreference(true)
    renderProbe()
    toggle()
    expect(screen.getByText('pt/idle')).toBeInTheDocument()
    expect(vi.getTimerCount()).toBe(0)
    reduce(false)
    toggle()
    advance(localeExitMs)
    expect(document.querySelector('[data-locale-letter]')).not.toBeNull()
    reduce(true)
    expect(screen.getByText('en/idle')).toBeInTheDocument()
    expect(document.querySelector('[data-locale-letter]')).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('falls back to a full-text fade when grapheme segmentation is unavailable', () => {
    vi.stubGlobal('Intl', Object.create(Intl, { Segmenter: { value: undefined } }))
    renderProbe()
    toggle()
    advance(localeExitMs)
    expect(document.querySelector('[data-locale-phase="reveal"] [aria-hidden]')).toHaveTextContent(
      'a ação 👩🏽‍💻 cafe\u0301!',
    )
    expect(document.querySelector('[data-locale-letter]')).toBeNull()
    advance(localeRevealMs)
    expect(screen.getByRole('heading').textContent).toBe(copy.pt)
  })
  it('cleans up timers when unmounted', () => {
    mediaPreference()
    const view = renderProbe()
    toggle()
    expect(vi.getTimerCount()).toBe(1)
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('keeps long translated content complete', () => {
    const value = { en: 'A long story. '.repeat(1000), pt: 'Uma história longa. '.repeat(1000) }
    render(
      <LocaleProvider>
        <MemoryRouter>
          <Header />
          <p data-testid="paragraph">
            <LocalizedText value={value} variant="body" />
          </p>
        </MemoryRouter>
      </LocaleProvider>,
    )
    expect(document.querySelector('[data-locale-letter]')).toBeNull()
    toggle()
    advance(localeExitMs)
    const paragraph = screen.getByTestId('paragraph')
    expect(paragraph.querySelector('[aria-hidden="true"]')!.textContent).toBe(value.pt)
    expect(paragraph.querySelector('[data-locale-letter]')).toBeNull()
    advance(localeRevealMs)
    expect(paragraph.textContent).toBe(value.pt)
    expect(document.querySelector('[data-locale-letter]')).toBeNull()
  })

  it.each([1, 139, 140])(
    'reveals %i graphemes according to text role rather than length or HTML tag',
    (length) => {
      const value = { en: 'Old paragraph.', pt: 'e\u0301'.repeat(length) }
      render(
        <LocaleProvider>
          <MemoryRouter>
            <Header />
            <h1>
              <LocalizedText value={value} />
            </h1>
            <p data-testid="paragraph">
              <LocalizedText value={value} variant="body" />
            </p>
            <LocalizedText value={value} variant="body" className="tagline" />
          </MemoryRouter>
        </LocaleProvider>,
      )
      toggle()
      advance(localeExitMs)
      const paragraph = screen.getByTestId('paragraph')
      expect(paragraph.querySelector('[data-locale-letter]')).toBeNull()
      expect(document.querySelector('.tagline [data-locale-letter]')).toBeNull()
      const heading = screen.getByRole('heading')
      expect(heading.querySelectorAll('[data-locale-letter]')).toHaveLength(length)
      expect(heading).toHaveAccessibleName(value.pt)
      expect(paragraph.querySelector('[aria-hidden="true"]')!.textContent).toBe(value.pt)
      advance(localeRevealMs)
      expect(paragraph.textContent).toBe(value.pt)
      expect(heading.textContent).toBe(value.pt)
      expect(document.querySelector('.tagline')!.textContent).toBe(value.pt)
      expect(document.querySelector('[data-locale-phase]')).toBeNull()
    },
  )
  it('supports unequal paragraph counts and localized empty/image states', () => {
    const category = {
      ...categories[0]!,
      description: { en: ['One paragraph.'], pt: ['Primeiro.', 'Segundo.'] },
    }
    const project = { ...projects[0]!, image: undefined, description: category.description }
    function Story() {
      const { toggleLocale } = useLocale()
      return (
        <>
          <button onClick={toggleLocale}>Toggle</button>
          <ProjectRail projects={[]} category="games" />
          <JourneyPanel category={category} projects={[project]} selected={project} />
        </>
      )
    }
    render(
      <LocaleProvider>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </LocaleProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    advance(localeExitMs)
    expect(screen.getByRole('img', { name: messages.missingImage.pt })).toBeInTheDocument()
    const paragraphs = document.querySelectorAll('article p [aria-hidden="true"]')
    expect(paragraphs[0]!.textContent).toBe('Primeiro.')
    expect(paragraphs[1]!.textContent).toBe('Segundo.')
    expect(document.querySelector('[data-locale-phase="reveal"]')).not.toBeNull()
    advance(localeRevealMs)
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    advance(localeExitMs)
    advance(localeRevealMs)
    expect(screen.getByText('One paragraph.')).toBeInTheDocument()
    expect(screen.queryByText('Segundo.')).not.toBeInTheDocument()
    expect(screen.getByText(messages.empty.en)).toBeInTheDocument()
  })
  it.each([0, localeExitMs])('completes the locale on navigation after %i ms', (time) => {
    window.history.replaceState(null, '', '/#/games')
    render(<App />)
    toggle()
    expect(window.location.hash).toBe('#/games')
    if (time) advance(time)
    fireEvent.click(screen.getByRole('link', { name: /Tiago Saraiva/ }))
    expect(window.location.hash).toBe('#/')
    expect(document.documentElement.lang).toBe('pt-BR')
    expect(document.querySelector('[data-locale-phase]')).toBeNull()
    expect(document.title).toBe('Designer e desenvolvedor. — Tiago Saraiva')
    advance(1000)
    expect(document.documentElement.lang).toBe('pt-BR')
  })
  it('uses the complete translated heading for the document title during reveal', () => {
    window.history.replaceState(null, '', '/#/web')
    render(<App />)
    toggle()
    advance(localeExitMs)
    expect(document.title).toBe(
      `${categories[1]!.headline.pt.replace(/\s+/g, ' ')} — Tiago Saraiva`,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      /Boas ideias merecem\s+ótimas interfaces\./,
    )
  })
})
