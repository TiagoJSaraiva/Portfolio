import { expect, test } from '@playwright/test'
import { messages } from '../src/data/messages'

for (const width of [360, 768, 1440]) {
  test(`translated text fades and reveals without reflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    for (const route of [
      '/',
      '/games',
      '/web',
      '/misc',
      '/web/studio',
      '/games/little-grove',
      '/misc/toolbox',
      '/missing',
    ]) {
      await page.goto(`/#${route}`)
      await page.evaluate(() => document.fonts.ready)
      await expect(page.locator('[data-locale-letter]')).toHaveCount(0)
      for (const target of ['pt-BR', 'en']) {
        const button = page.locator('header button')
        await button.focus()
        const result = await page.evaluate(async () => {
          const button = document.querySelector<HTMLButtonElement>('header button')!
          let minimumExitOpacity = 1
          let sawLeftToRight = false
          let maximumLetters = 0
          let sawBusy = false
          let sawReveal = false
          let measured: { element: Element; width: number; height: number }[] = []
          let firstWordTiming: { delay: number; duration: number }[] = []
          const start = performance.now()
          button.click()
          // A second activation must not queue or reverse this transition.
          button.click()
          return await new Promise<{
            minimumExitOpacity: number
            sawLeftToRight: boolean
            maximumLetters: number
            sawBusy: boolean
            elapsed: number
            retainedFocus: boolean
            firstWordTiming: { delay: number; duration: number }[]
            sizeChanges: number[]
          }>((resolve, reject) => {
            function frame() {
              const exit = document.querySelector('[data-locale-phase="exit"]')
              if (exit)
                minimumExitOpacity = Math.min(
                  minimumExitOpacity,
                  Number(getComputedStyle(exit).opacity),
                )
              sawBusy ||= button.getAttribute('aria-disabled') === 'true'
              const letters = document.querySelectorAll('[data-locale-letter]')
              maximumLetters = Math.max(maximumLetters, letters.length)
              if (letters.length && !sawReveal) {
                sawReveal = true
                measured = Array.from(document.querySelectorAll('main h1, main p')).map(
                  (element) => {
                    const rect = element.getBoundingClientRect()
                    return { element, width: rect.width, height: rect.height }
                  },
                )
                const visual = letters[0]!.parentElement!
                const word = visual.textContent!.match(/\S+/u)![0]
                const length = Array.from(
                  new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(word),
                ).length
                firstWordTiming = Array.from(visual.querySelectorAll('[data-locale-letter]'))
                  .slice(0, length)
                  .map((letter) => {
                    const css = getComputedStyle(letter)
                    return {
                      delay: Number.parseFloat(css.animationDelay) * 1000,
                      duration: Number.parseFloat(css.animationDuration) * 1000,
                    }
                  })
              }
              if (letters.length) {
                const first = Number(getComputedStyle(letters[0]!).opacity)
                const last = Number(
                  getComputedStyle(letters[Math.min(2, letters.length - 1)]!).opacity,
                )
                sawLeftToRight ||= first > last + 0.05
              }
              if (sawReveal && !letters.length && !button.hasAttribute('aria-disabled')) {
                resolve({
                  minimumExitOpacity,
                  sawLeftToRight,
                  maximumLetters,
                  sawBusy,
                  elapsed: performance.now() - start,
                  retainedFocus: document.activeElement === button,
                  firstWordTiming,
                  sizeChanges: measured.map(({ element, width, height }) => {
                    const rect = element.getBoundingClientRect()
                    return Math.max(Math.abs(rect.width - width), Math.abs(rect.height - height))
                  }),
                })
              } else if (performance.now() - start > 5000)
                reject(new Error('Locale transition did not finish'))
              else requestAnimationFrame(frame)
            }
            requestAnimationFrame(frame)
          })
        })
        expect(result.minimumExitOpacity).toBeLessThan(0.95)
        expect(result.sawLeftToRight).toBe(true)
        expect(result.sawBusy).toBe(true)
        expect(result.maximumLetters).toBeGreaterThan(0)
        expect(result.retainedFocus).toBe(true)
        expect(result.elapsed).toBeGreaterThanOrEqual(590)
        expect(result.sizeChanges.every((change) => change < 1)).toBe(true)
        expect(result.firstWordTiming[0]!.delay).toBe(0)
        const last = result.firstWordTiming.at(-1)!
        expect(last.delay + last.duration).toBeCloseTo(450, 0)
        await expect(page.locator('html')).toHaveAttribute('lang', target)
        await expect(page).toHaveURL(new RegExp(`#${route.replaceAll('/', '\\/')}$`))
        await expect(page.locator('[data-locale-phase]')).toHaveCount(0)
        await expect
          .poll(() =>
            page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          )
          .toBe(true)
        if (route === '/' && width < 900) {
          const contained = await page.locator('main a p').evaluateAll((paragraphs) =>
            paragraphs.every((paragraph) => {
              const sector = paragraph.closest('a')!.getBoundingClientRect()
              const range = document.createRange()
              range.selectNodeContents(paragraph)
              return Array.from(range.getClientRects()).every(
                (rect) =>
                  rect.left >= sector.left &&
                  rect.right <= sector.right &&
                  rect.top >= sector.top &&
                  rect.bottom <= sector.bottom,
              )
            }),
          )
          expect(contained).toBe(true)
        }
        const heading = await page.locator('h1').getAttribute('aria-label')
        if (route !== '/')
          await expect(page).toHaveTitle(`${heading!.replace(/\s+/g, ' ')} — Tiago Saraiva`)
        if (route === '/' || route === '/web/studio') {
          await page.screenshot({
            path: `test-results/screenshots/locale-${width}-${route === '/' ? 'home' : 'project'}-${target}.png`,
            fullPage: true,
          })
        }
      }
    }
  })
}

test('keyboard activations are ignored while busy and reduced motion finishes an active effect', async ({
  page,
}) => {
  await page.goto('/#/web')
  await page.clock.install()
  await page.clock.pauseAt(new Date())
  const button = page.locator('header button')
  await button.focus()
  await page.keyboard.press('Enter')
  await expect(button).toHaveAttribute('aria-disabled', 'true')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Space')
  await page.clock.runFor(150)
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
  await expect(page.locator('[data-locale-letter]').first()).toBeAttached()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(button).not.toHaveAttribute('aria-disabled')
  await expect(page.locator('[data-locale-letter]')).toHaveCount(0)
  await expect(button).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(button).not.toHaveAttribute('aria-disabled')
  await expect(page.locator('[data-locale-phase]')).toHaveCount(0)
})

test('a selected project keeps its route and accessible labels throughout a long translation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 960 })
  const longText = 'Uma história com ação, decisões e aprendizados. '.repeat(100)
  // Seed the fixture in the actual module loaded by the page, including Vite's
  // HMR query string. Importing the bare path can create a second module instance.
  await page.route('**/src/data/portfolio.ts*', async (route) => {
    const response = await route.fetch()
    await route.fulfill({
      response,
      body: `${await response.text()}\nprojects.find(project => project.id === 'studio').description.pt = ${JSON.stringify([longText, 'Mais um parágrafo.'])};`,
    })
  })
  await page.goto('/#/web/studio')
  await page.clock.install()
  await page.clock.pauseAt(new Date())
  await page.getByRole('button', { name: messages.language.en }).click()
  await page.clock.runFor(150)
  await expect(page.locator('[data-locale-letter]').first()).toBeAttached()
  const paragraph = page.locator('article p').first()
  await expect(paragraph.locator('[data-locale-letter]')).toHaveCount(0)
  await expect(paragraph.locator('[aria-hidden="true"]')).toHaveText(longText)
  await expect(page.getByRole('link', { name: messages.github.pt })).toBeVisible()
  await expect(page.getByRole('link', { name: messages.visit.pt, exact: true })).toBeVisible()
  await page.clock.runFor(450)
  await expect(page.locator('[data-locale-letter]')).toHaveCount(0)
  await expect(page.getByText(longText, { exact: true })).toBeVisible()
  await expect(page.getByText('Mais um parágrafo.', { exact: true })).toBeVisible()
  await expect(page).toHaveURL(/#\/web\/studio$/)
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true)
})

test('navigation during exit or reveal completes the chosen language on the destination', async ({
  page,
}) => {
  await page.goto('/#/games')
  await page.clock.install()
  await page.clock.pauseAt(new Date())
  await page.locator('header button').click()
  await page.getByRole('link', { name: /Tiago Saraiva/ }).click()
  await expect(page).toHaveURL(/#\/$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
  await expect(page.locator('[data-locale-phase]')).toHaveCount(0)
  await page.locator('header button').click()
  await page.clock.runFor(150)
  await expect(page.locator('[data-locale-letter]').first()).toBeAttached()
  await page.getByRole('link', { name: 'Games', exact: true }).getByRole('heading').click()
  await expect(page).toHaveURL(/#\/games$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('[data-locale-phase]')).toHaveCount(0)
  await expect(page.locator('h1')).toBeFocused()
})

for (const scenario of ['missing image', 'empty category']) {
  test(`translates the ${scenario} state in Chromium`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 960 })
    await page.route('**/src/data/portfolio.ts*', async (route) => {
      const response = await route.fetch()
      const fixture =
        scenario === 'missing image'
          ? "projects.find(project => project.id === 'orbit').image = undefined;"
          : 'projects.splice(0, projects.length);'
      await route.fulfill({ response, body: `${await response.text()}\n${fixture}` })
    })
    await page.goto(scenario === 'missing image' ? '/#/games/orbit' : '/#/games')
    await page.clock.install()
    await page.clock.pauseAt(new Date())
    await page.locator('header button').click()
    await page.clock.runFor(150)
    if (scenario === 'missing image') {
      await expect(page.getByRole('img', { name: messages.missingImage.pt })).toHaveCount(2)
      await expect(page.getByRole('link', { name: messages.github.pt })).toBeVisible()
      await expect(page.getByRole('link', { name: messages.visit.pt, exact: true })).toBeVisible()
    } else {
      await expect(page.locator('[data-carousel-viewport]')).toHaveCount(0)
      await expect(page.getByRole('button', { name: messages.next.pt })).toHaveCount(0)
    }
    await page.clock.runFor(450)
    await expect(page.locator('[data-locale-phase]')).toHaveCount(0)
    if (scenario === 'empty category') await expect(page.getByText(messages.empty.pt)).toBeVisible()
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true)
  })
}
