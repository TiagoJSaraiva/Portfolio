import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

const ball = (page: Page, id = 'games') => page.locator(`[data-ball-handle][data-category="${id}"]`)
const state = (page: Page) => page.locator('[data-transition-phase]')
async function center(locator: Locator) {
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 }
}
async function setup(page: Page, width = 1440) {
  await page.setViewportSize({ width, height: 960 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.clock.install({ time: new Date('2026-10-10T12:00:00Z') })
  await page.clock.pauseAt(new Date('2026-10-10T12:00:01Z'))
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await expect(ball(page)).toBeVisible()
  await page.clock.runFor(100)
  await expect
    .poll(async () => {
      await page.clock.runFor(32)
      const origin = await center(page.locator('button[data-category="games"] [data-ball-origin]'))
      const actual = await center(ball(page))
      return Math.hypot(origin.x - actual.x, origin.y - actual.y)
    })
    .toBeLessThan(0.1)
}
async function startDrag(page: Page, id = 'games') {
  const origin = await center(ball(page, id))
  await page.mouse.move(origin.x, origin.y)
  await page.clock.runFor(500)
  const contact = await center(ball(page, id))
  await page.mouse.move(contact.x, contact.y)
  await page.mouse.down()
  await page.clock.runFor(20)
  return contact
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
}

async function finishTransition(page: Page) {
  // Give React a commit between phases instead of advancing every animation in one large jump.
  for (let frame = 0; frame < 120; frame++) {
    if ((await state(page).getAttribute('data-transition-phase')) === 'ready') break
    await page.clock.runFor(50)
  }
  await expect(state(page)).toHaveAttribute('data-transition-phase', 'ready')
}

for (const width of [360, 768, 1440]) {
  test(`elastic attraction, stationary text and keyboard focus at ${width}px`, async ({ page }) => {
    await setup(page, width)
    const origin = await center(ball(page))
    const label = page
      .getByRole('button', { name: 'Games', exact: true })
      .getByText('Games', { exact: true })
    const labelBox = await label.boundingBox()
    await page.mouse.move(origin.x + 65, origin.y)
    await page.clock.runFor(1000)
    const attracted = await center(ball(page))
    expect(attracted.x - origin.x).toBeGreaterThan(2)
    expect(attracted.x - origin.x).toBeLessThanOrEqual(width < 900 ? 16 : 24)
    expect(Math.abs(attracted.y - origin.y)).toBeLessThan(0.1)
    expect(await label.boundingBox()).toEqual(labelBox)
    await page.mouse.move(width - 10, 930)
    await page.clock.runFor(1000)
    expect(Math.abs((await center(ball(page))).x - origin.x)).toBeLessThan(0.1)
    await page.keyboard.press('Tab')
    await page.getByRole('button', { name: 'Games', exact: true }).focus()
    await page.mouse.move(origin.x + 65, origin.y)
    await page.clock.runFor(1000)
    expect(Math.abs((await center(ball(page))).x - origin.x)).toBeLessThan(0.1)
    await expect(ball(page).locator('[data-sector-icon]')).toHaveAttribute('data-focused', 'true')
    await noOverflow(page)
  })

  test(`drag crosses sectors and hands off at the release point at ${width}px`, async ({
    page,
  }) => {
    await setup(page, width)
    const original = await center(ball(page))
    const webBefore = await center(ball(page, 'web'))
    await startDrag(page)
    await expect(state(page)).toHaveAttribute('data-attraction-enabled', 'false')
    await expect(state(page)).toHaveAttribute('data-transition-phase', 'idle')
    await page.mouse.move(width - 90, 790, { steps: 8 })
    await page.clock.runFor(50)
    await expect(ball(page)).toHaveAttribute('data-dragging', 'true')
    expect(await center(ball(page, 'web'))).toEqual(webBefore)
    // Release immediately after another move, without waiting for an animation frame.
    await page.mouse.move(width - 85, 795)
    const releasePoint = await center(ball(page).locator('[data-sector-icon]'))
    await page.screenshot({ path: `test-results/screenshots/${width}-ball-drag.png` })
    await page.mouse.up()
    await expect(page).toHaveURL(/#\/games$/)
    await expect(state(page)).toHaveAttribute('data-transition-phase', 'covering')
    const flying = page.locator('[data-flying-icon]')
    const initial = await center(flying)
    expect(Math.abs(initial.x - releasePoint.x)).toBeLessThan(0.2)
    expect(Math.abs(initial.y - releasePoint.y)).toBeLessThan(0.2)
    await page.clock.runFor(500)
    const covered = await center(flying)
    expect(Math.abs(covered.x - releasePoint.x)).toBeLessThan(0.2)
    expect(Math.abs(covered.y - releasePoint.y)).toBeLessThan(0.2)
    await finishTransition(page)
    await page.mouse.move(width - 10, 930)
    await page.getByRole('button', { name: 'Back to home' }).click()
    await page.clock.runFor(500)
    await expect(page.getByRole('button', { name: 'Games', exact: true })).toBeFocused()
    await expect(state(page)).toHaveAttribute('data-attraction-enabled', 'true')
    expect(await center(ball(page))).toEqual(original)
    // Move focus off the sector before checking rearmed attraction.
    await page.locator('h1').focus()
    await page.mouse.move(original.x + 65, original.y)
    await page.clock.runFor(1000)
    expect((await center(ball(page))).x).toBeGreaterThan(original.x + 2)
    await noOverflow(page)
  })
}

test('circle and ring stay inside every edge; Escape cancels and Enter still selects', async ({
  page,
}) => {
  await setup(page)
  const original = await center(ball(page))
  await startDrag(page)
  for (const point of [
    { x: 0, y: 0 },
    { x: 1439, y: 959 },
  ]) {
    await page.mouse.move(point.x, point.y)
    await page.clock.runFor(20)
    const ring = await ball(page).locator('[data-sector-icon] > span').boundingBox()
    expect(ring!.x).toBeGreaterThanOrEqual(-0.1)
    expect(ring!.y).toBeGreaterThanOrEqual(-0.1)
    expect(ring!.x + ring!.width).toBeLessThanOrEqual(1440.1)
    expect(ring!.y + ring!.height).toBeLessThanOrEqual(960.1)
  }
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await page.clock.runFor(500)
  await expect(state(page)).toHaveAttribute('data-transition-phase', 'idle')
  await expect(state(page)).toHaveAttribute('data-attraction-enabled', 'false')
  expect(await center(ball(page))).toEqual(original)
  await page.mouse.move(original.x + 60, original.y)
  await page.clock.runFor(500)
  expect(await center(ball(page))).toEqual(original)
  await page.getByRole('button', { name: 'Games', exact: true }).press('Enter')
  await expect(page).toHaveURL(/#\/games$/)
  await finishTransition(page)
  await page.getByRole('button', { name: 'Back to home' }).click()
  await page.getByRole('button', { name: 'Web', exact: true }).press('Space')
  await expect(page).toHaveURL(/#\/web$/)
})

test('click without drag and a flight starting at the corner target select once', async ({
  page,
}) => {
  await setup(page)
  await startDrag(page)
  await page.mouse.up()
  await expect(page).toHaveURL(/#\/games$/)
  await finishTransition(page)
  await page.getByRole('button', { name: 'Back to home' }).click()
  const contact = await startDrag(page)
  await page.mouse.move(100, 100)
  await page.clock.runFor(20)
  const released = await center(ball(page).locator('[data-sector-icon]'))
  expect(Math.abs(released.x - 100)).toBeLessThan(1)
  expect(Math.abs(released.y - 100)).toBeLessThan(1)
  expect(contact.x).toBeGreaterThan(100)
  await page.mouse.up()
  await finishTransition(page)
  expect(await center(page.getByRole('button', { name: 'Back to home' }))).toEqual({
    x: 100,
    y: 100,
  })
})

test('resize, capture loss, blur and reduced motion cancel active drags', async ({ page }) => {
  await setup(page)
  for (const reason of ['capture', 'blur', 'resize', 'reduced']) {
    await startDrag(page)
    await page.mouse.move(700, 650)
    await page.clock.runFor(20)
    if (reason === 'capture')
      await ball(page).evaluate((element) =>
        element.dispatchEvent(
          new PointerEvent('lostpointercapture', { pointerId: 1, bubbles: true }),
        ),
      )
    if (reason === 'blur') await page.evaluate(() => window.dispatchEvent(new Event('blur')))
    if (reason === 'resize') await page.setViewportSize({ width: 768, height: 960 })
    if (reason === 'reduced') await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.mouse.up()
    await page.clock.runFor(500)
    await expect(state(page)).toHaveAttribute('data-transition-phase', 'idle')
    await expect(ball(page)).not.toHaveAttribute('data-dragging')
    const anchor = page.locator('button[data-category="games"] [data-ball-origin]')
    expect(await center(ball(page))).toEqual(await center(anchor))
    await page.reload()
    await page.clock.runFor(100)
  }
  await expect(state(page)).toHaveAttribute('data-attraction-enabled', 'false')
  const origin = await center(ball(page))
  await page.mouse.move(origin.x + 65, origin.y)
  await page.clock.runFor(500)
  expect(await center(ball(page))).toEqual(origin)
  await startDrag(page)
  await page.mouse.move(500, 700)
  await page.mouse.up()
  await expect(state(page)).toHaveAttribute('data-transition-phase', 'ready')
})

test('language, history and direct routes preserve interaction lifecycle', async ({ page }) => {
  await setup(page)
  await page.getByRole('button', { name: 'Change language to Portuguese' }).click()
  await page.clock.runFor(800)
  await expect(page.getByRole('button', { name: 'Jogos', exact: true })).toBeVisible()
  await startDrag(page)
  await page.mouse.move(900, 600)
  await page.clock.runFor(20)
  await page.mouse.up()
  await page.clock.runFor(200)
  await page.evaluate(() => history.back())
  await expect(state(page)).toHaveAttribute('data-transition-phase', 'idle')
  await expect(state(page)).toHaveAttribute('data-attraction-enabled', 'true')
  await page.evaluate(() => history.forward())
  await expect(state(page)).toHaveAttribute('data-transition-phase', 'ready')
  await expect(page.getByRole('button', { name: 'Voltar ao início' })).toBeVisible()
  await expect(state(page)).toHaveAttribute('data-attraction-enabled', 'false')
  await page.goto('/#/web')
  await expect(state(page)).toHaveAttribute('data-transition-phase', 'ready')
  await expect(page.locator('[data-flying-icon]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Voltar ao início' }).click()
  await expect(state(page)).toHaveAttribute('data-attraction-enabled', 'true')
})

test('real touch drag preserves scrolling outside the ball and restores scroll on return', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 360, height: 560 },
    hasTouch: true,
    isMobile: true,
  })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:5173/')
  const cdp = await context.newCDPSession(page)
  const touch = async (
    type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel',
    x = 0,
    y = 0,
  ) => {
    await cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: type === 'touchEnd' || type === 'touchCancel' ? [] : [{ x, y, id: 1, force: 1 }],
    })
  }
  await touch('touchStart', 330, 490)
  await touch('touchMove', 330, 350)
  await touch('touchMove', 330, 180)
  await touch('touchEnd')
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0)
  // Let the real swipe's momentum finish before measuring the drag's saved scroll.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let previous = scrollY
        let stableFrames = 0
        function settled() {
          stableFrames = scrollY === previous ? stableFrames + 1 : 0
          previous = scrollY
          if (stableFrames >= 12) resolve()
          else requestAnimationFrame(settled)
        }
        requestAnimationFrame(settled)
      }),
  )
  await page.getByRole('button', { name: 'Misc', exact: true }).scrollIntoViewIfNeeded()
  const origin = await center(ball(page, 'misc'))
  const scroll = await page.evaluate(() => scrollY)
  await touch('touchStart', origin.x, origin.y)
  await touch('touchMove', 230, 160)
  await expect(ball(page, 'misc')).toHaveAttribute('data-dragging', 'true')
  expect(await page.evaluate(() => scrollY)).toBe(scroll)
  await touch('touchEnd')
  await expect(page).toHaveURL(/#\/misc$/)
  await expect(state(page)).toHaveAttribute('data-transition-phase', 'ready')
  const back = await center(page.getByRole('button', { name: 'Back to home' }))
  await touch('touchStart', back.x, back.y)
  await touch('touchMove', back.x + 10, back.y + 10)
  await touch('touchEnd')
  await expect(page).toHaveURL(/#\/misc$/)
  await touch('touchStart', back.x, back.y)
  await touch('touchCancel')
  await expect(page).toHaveURL(/#\/misc$/)
  await page.getByRole('button', { name: 'Back to home' }).tap()
  await expect(page).toHaveURL(/#\/$/)
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(scroll)
  await expect(page.getByRole('button', { name: 'Misc', exact: true })).toBeFocused()
  expect(await center(ball(page, 'misc'))).toEqual(origin)
  await noOverflow(page)
  // A canceled touch must neither select nor rearm attraction.
  await touch('touchStart', origin.x, origin.y)
  await touch('touchMove', 200, 180)
  await touch('touchCancel')
  await expect(state(page)).toHaveAttribute('data-transition-phase', 'idle')
  await expect(state(page)).toHaveAttribute('data-attraction-enabled', 'false')
  await context.close()
})
