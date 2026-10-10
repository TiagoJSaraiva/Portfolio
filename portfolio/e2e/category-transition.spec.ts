import { expect, test } from '@playwright/test'

for (const width of [360, 768, 1440]) {
  for (const [category, label] of [
    ['games', 'Games'],
    ['web', 'Web'],
    ['misc', 'Misc'],
  ]) {
    test(`${category} coverage, flight and reveal at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 })
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.goto('/')
      await page.clock.install()
      await page.clock.pauseAt(new Date())
      const state = page.locator('[data-transition-phase]')
      const icons = await page.locator('[data-sector-icon]').evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect()
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
        }),
      )
      await page
        .getByRole('button', { name: label, exact: true })
        .getByText(label, { exact: true })
        .click()
      await expect(state).toHaveAttribute('data-transition-phase', 'covering')
      await expect(page).toHaveURL(new RegExp(`#/${category}$`))
      await page.clock.runFor(50)
      const filled = await page.locator('[data-coverage-surface]').evaluate((element, points) => {
        const path = element as SVGPathElement
        return points.map((point) => path.isPointInFill(new DOMPoint(point.x, point.y)))
      }, icons)
      expect(filled).toEqual(['games', 'web', 'misc'].map((id) => id === category))
      // Programmatic repeated clicks must be guarded as well as native pointer input.
      await page
        .locator('main button[data-category="web"]')
        .evaluate((element) => (element as HTMLButtonElement).click())
      await expect(page).toHaveURL(new RegExp(`#/${category}$`))
      await page.clock.runFor(250)
      await expect(state).toHaveAttribute('data-transition-phase', 'covering')
      await expect(page.locator('header')).toBeVisible()
      await page.screenshot({ path: `test-results/screenshots/${width}-${category}-coverage.png` })
      await page.clock.runFor(450)
      await expect(state).toHaveAttribute('data-transition-phase', 'flying')
      await expect(page.locator('#main-content h1')).toHaveCount(0)
      const inset = width < 900 ? 28 : 48
      let overshot = false
      for (let frame = 0; frame < 30; frame++) {
        const box = await page.locator('[data-flying-icon]').boundingBox()
        expect(box).not.toBeNull()
        expect(box!.x).toBeGreaterThanOrEqual(0)
        expect(box!.y).toBeGreaterThanOrEqual(0)
        expect(box!.x + box!.width).toBeLessThanOrEqual(width)
        expect(box!.y + box!.height).toBeLessThanOrEqual(960)
        overshot ||= box!.x < inset - 0.5 || box!.y < inset - 0.5
        await page.clock.runFor(40)
        if ((await state.getAttribute('data-transition-phase')) !== 'flying') break
      }
      expect(overshot).toBe(true)
      await expect(state).toHaveAttribute('data-transition-phase', 'revealing')
      const title = page.getByRole('heading', { level: 1, name: label, exact: true })
      await expect(title).toBeVisible()
      await expect(title.locator('[data-locale-letter]')).toHaveCount(label.length)
      await expect(title.locator('[data-locale-phase]')).toHaveAttribute(
        'data-locale-phase',
        'reveal',
      )
      await page.clock.runFor(200)
      await expect(page.locator('[data-carousel-viewport]')).toBeVisible()
      await page.screenshot({ path: `test-results/screenshots/${width}-${category}-reveal.png` })
      await page.clock.runFor(600)
      await expect(state).toHaveAttribute('data-transition-phase', 'ready')
      const back = page.getByRole('button', { name: 'Back to home' })
      const target = await back.boundingBox()
      expect(target!.x).toBe(inset)
      expect(target!.y).toBe(inset)
      expect(target!.width).toBe(width < 900 ? 78 : 104)
      const titleBox = await title.boundingBox()
      expect(titleBox!.x).toBeGreaterThan(target!.x + target!.width + 12)
      expect(
        Math.abs(titleBox!.y + titleBox!.height / 2 - target!.y - target!.height / 2),
      ).toBeLessThan(1)
      expect(titleBox!.x + titleBox!.width).toBeLessThan(width)
      await expect(title.locator('[data-locale-letter]')).toHaveCount(0)
      await expect(page.getByRole('heading', { level: 2 })).toHaveCount(4)
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true)
      await back.click()
      await expect(page.getByRole('button', { name: label, exact: true })).toBeFocused()
    })
  }
}

test('history cancels transitions and forward navigation does not replay them', async ({
  page,
}) => {
  await page.goto('/')
  await page.clock.install()
  await page.clock.pauseAt(new Date())
  await page
    .getByRole('button', { name: 'Games', exact: true })
    .getByText('Games', { exact: true })
    .click()
  await page.clock.runFor(300)
  await page.evaluate(() => window.history.back())
  await expect(page.locator('[data-transition-phase]')).toHaveAttribute(
    'data-transition-phase',
    'idle',
  )
  await expect(page.locator('[data-flying-icon]')).toHaveCount(0)
  await page.evaluate(() => window.history.forward())
  await expect(page.locator('[data-transition-phase]')).toHaveAttribute(
    'data-transition-phase',
    'ready',
  )
  await page.clock.runFor(3000)
  await expect(page.locator('[data-flying-icon]')).toHaveCount(0)
})

test('resize and reduced motion finish an active transition safely', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.goto('/')
  await page.clock.install()
  await page.clock.pauseAt(new Date())
  await page
    .getByRole('button', { name: 'Web', exact: true })
    .getByText('Web', { exact: true })
    .click()
  await page.clock.runFor(150)
  await page.setViewportSize({ width: 360, height: 800 })
  await page.clock.runFor(30)
  await expect(page.locator('[data-transition-phase]')).toHaveAttribute(
    'data-transition-phase',
    'ready',
  )
  await page.getByRole('button', { name: 'Back to home' }).click()
  await page
    .getByRole('button', { name: 'Misc', exact: true })
    .getByText('Misc', { exact: true })
    .click()
  await page.clock.runFor(200)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('[data-transition-phase]')).toHaveAttribute(
    'data-transition-phase',
    'ready',
  )
  await expect(page.getByRole('button', { name: 'Pause automatic scrolling' })).toHaveCount(0)
})

for (const phase of ['flying', 'revealing']) {
  test(`reduced motion interrupts ${phase} and settles the trail immediately`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 })
    await page.goto('/')
    await page.clock.install()
    await page.clock.pauseAt(new Date())
    await page
      .getByRole('button', { name: 'Misc', exact: true })
      .getByText('Misc', { exact: true })
      .click()
    const state = page.locator('[data-transition-phase]')
    await page.clock.runFor(750)
    for (
      let frame = 0;
      frame < 80 && (await state.getAttribute('data-transition-phase')) !== phase;
      frame++
    ) {
      await page.clock.runFor(40)
    }
    await expect(state).toHaveAttribute('data-transition-phase', phase)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(state).toHaveAttribute('data-transition-phase', 'ready')
    await expect(page.locator('[data-flying-icon]')).toHaveCount(0)
    const viewport = await page.locator('[data-carousel-viewport]').boundingBox()
    expect(viewport!.y).toBe(380)
    await page.clock.runFor(1000)
    expect((await page.locator('[data-carousel-viewport]').boundingBox())!.y).toBe(380)
  })
}

test('touch selection restores the scrolled mobile landing', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 360, height: 560 },
    hasTouch: true,
    isMobile: true,
  })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:5173/')
  const misc = page.getByRole('button', { name: 'Misc', exact: true })
  await misc.scrollIntoViewIfNeeded()
  const scroll = await page.evaluate(() => window.scrollY)
  expect(scroll).toBeGreaterThan(0)
  await misc.getByText('Misc', { exact: true }).tap()
  await expect(page.locator('[data-transition-phase]')).toHaveAttribute(
    'data-transition-phase',
    'covering',
  )
  await expect(page.locator('[data-transition-phase]')).toHaveAttribute(
    'data-transition-phase',
    'ready',
  )
  await page.getByRole('button', { name: 'Back to home' }).tap()
  await expect(misc).toBeFocused()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scroll)
  await context.close()
})

test('trail pauses for hover, focus, explicit control and drags outside; Enter still opens a link', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 })
  await context.route(/https:\/\/(www\.youtube\.com|github\.com)\/.*/, (route) =>
    route.fulfill({ body: '<title>Project destination</title>' }),
  )
  await page.clock.install({ time: new Date('2026-10-10T12:00:00Z') })
  await page.clock.pauseAt(new Date('2026-10-10T12:00:01Z'))
  await page.goto('/#/web')
  const track = page.locator('[data-carousel-track]')
  const position = () =>
    track.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41)
  await page.mouse.move(20, 850)
  await page.clock.runFor(1200)
  const before = await position()
  await page.clock.runFor(250)
  expect(await position()).not.toBe(before)
  await page.locator('[data-carousel-viewport]').hover()
  await page.clock.runFor(50)
  const hovered = await position()
  await page.clock.runFor(250)
  expect(await position()).toBe(hovered)
  await page.mouse.move(20, 850)
  const pause = page.getByRole('button', { name: 'Pause automatic scrolling' })
  await pause.click()
  await page.getByRole('heading', { level: 1 }).focus()
  await page.mouse.move(20, 850)
  await page.clock.runFor(50)
  const stopped = await position()
  await page.clock.runFor(250)
  expect(await position()).toBe(stopped)
  await page.getByRole('button', { name: 'Resume automatic scrolling' }).click()
  const visit = page.getByRole('link', { name: 'Open project — Studio', exact: true })
  await visit.focus()
  await page.clock.runFor(600)
  const focused = await position()
  await page.clock.runFor(250)
  expect(await position()).toBe(focused)
  const viewport = await page.locator('[data-carousel-viewport]').boundingBox()
  await page.mouse.move(viewport!.x + 220, viewport!.y + 40)
  await page.mouse.down()
  await page.mouse.move(viewport!.x + 90, viewport!.y + 40, { steps: 8 })
  await page.mouse.move(90, 850, { steps: 8 })
  await page.clock.runFor(200)
  expect(context.pages()).toHaveLength(1)
  await page.mouse.up()
  await visit.focus()
  const opened = context.waitForEvent('page')
  await visit.press('Enter')
  const destination = await opened
  await destination.waitForLoadState()
  expect(destination.url()).toBe('https://www.youtube.com/')
  await destination.close()
  await page.getByRole('heading', { level: 1 }).focus()
  await page.mouse.move(20, 850)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.getByRole('button', { name: 'Pause automatic scrolling' })).toHaveCount(0)
  await page.clock.runFor(600)
  const reduced = await position()
  await page.clock.runFor(300)
  expect(Math.abs((await position()) - reduced)).toBeLessThan(0.1)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.clock.runFor(300)
  expect(await position()).not.toBe(reduced)
  await page.setViewportSize({ width: 768, height: 960 })
  await page.clock.runFor(300)
  const resized = await position()
  await page.clock.runFor(300)
  expect(await position()).not.toBe(resized)
})
