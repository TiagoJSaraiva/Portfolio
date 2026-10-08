import { expect, test } from '@playwright/test'

for (const width of [360, 768, 1440]) {
  test(`layouts and project links at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const route of [
      '/',
      '/games',
      '/web',
      '/misc',
      '/games/orbit',
      '/web/atlas',
      '/misc/toolbox',
      '/games/echo',
    ]) {
      await page.goto(`/#${route}`)
      await expect(page.locator('h1')).toBeVisible()
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true)
      await expect
        .poll(() =>
          page
            .locator('img')
            .evaluateAll((images) =>
              images.every(
                (image) =>
                  (image as HTMLImageElement).complete &&
                  (image as HTMLImageElement).naturalWidth > 0,
              ),
            ),
        )
        .toBe(true)
      if (route !== '/') {
        await expect(
          page.getByRole('navigation', { name: 'Explore other categories' }).getByRole('link'),
        ).toHaveCount(2)
        if (width < 900) {
          const rail = await page.getByRole('region', { name: 'Selected work' }).boundingBox()
          const heading = await page.locator('h1').boundingBox()
          expect(rail!.y).toBeLessThan(heading!.y)
        }
      }
      await page.screenshot({
        path: `test-results/screenshots/${width}-${route.replaceAll('/', '-') || 'home'}.png`,
        fullPage: true,
        animations: 'disabled',
      })
    }
    await page.goto('/#/games/echo')
    await expect(page.getByRole('link', { name: 'View on GitHub' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Open project', exact: true })).toHaveCount(0)
  })
}

test('navigation, sharing, history, language persistence and keyboard', async ({ page }) => {
  await page.goto('/')
  await page
    .getByRole('link', { name: 'Games', exact: true })
    .getByRole('heading', { name: 'Games' })
    .click()
  await expect(page).toHaveURL(/#\/games$/)
  await page
    .getByRole('region', { name: 'Selected work' })
    .getByRole('link', { name: /Orbit/ })
    .click()
  await expect(page.locator('h1')).toHaveText('Orbit')
  await page.reload()
  await expect(page.locator('h1')).toHaveText('Orbit')
  await page.getByRole('button', { name: 'Change language to Portuguese' }).click()
  await page.reload()
  await expect(page.getByRole('link', { name: 'Voltar à trajetória' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar à trajetória' }).click()
  await page.goBack()
  await expect(page.locator('h1')).toHaveText('Orbit')
  await page.goForward()
  await expect(page.locator('h1')).toContainText('Pequenos mundos')
  await page.getByRole('navigation').getByRole('link', { name: 'Web', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/web$/)
  await expect(page.locator('h1')).toBeFocused()
})

test('language codes stay in place as their emphasis changes', async ({ page }) => {
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
    const englishToggle = page.getByRole('button', { name: 'Change language to Portuguese' })
    const codes = page.locator('header button [data-active]')
    await expect(codes).toHaveText(['EN', 'PT'])
    const transitionDurations = await codes
      .nth(0)
      .evaluate((element) => getComputedStyle(element).transitionDuration)
    expect(transitionDurations).toBe('0.18s, 0.18s')

    const initialPositions = await codes.evaluateAll((elements) =>
      elements.map((element) => {
        const { x, y, width, height } = element.getBoundingClientRect()
        return { centerX: x + width / 2, centerY: y + height / 2 }
      }),
    )
    await expect(codes.nth(0)).toHaveCSS('font-size', '11px')
    await expect(codes.nth(0)).toHaveCSS('color', 'rgb(233, 233, 237)')
    await expect(codes.nth(1)).toHaveCSS('font-size', '9px')
    await expect(codes.nth(1)).toHaveCSS('color', 'rgb(98, 98, 110)')

    await englishToggle.click()
    const portugueseToggle = page.getByRole('button', { name: 'Mudar idioma para inglês' })
    await expect(codes).toHaveText(['EN', 'PT'])
    await expect(codes.nth(0)).toHaveCSS('font-size', '9px')
    await expect(codes.nth(0)).toHaveCSS('color', 'rgb(98, 98, 110)')
    await expect(codes.nth(1)).toHaveCSS('font-size', '11px')
    await expect(codes.nth(1)).toHaveCSS('color', 'rgb(233, 233, 237)')

    const portuguesePositions = await codes.evaluateAll((elements) =>
      elements.map((element) => {
        const { x, y, width, height } = element.getBoundingClientRect()
        return { centerX: x + width / 2, centerY: y + height / 2 }
      }),
    )
    for (const [index, position] of portuguesePositions.entries()) {
      expect(Math.abs(position.centerX - initialPositions[index].centerX)).toBeLessThan(0.5)
      expect(Math.abs(position.centerY - initialPositions[index].centerY)).toBeLessThan(0.5)
    }

    await page.emulateMedia({ reducedMotion: 'reduce' })
    const reducedTransitionDurations = await codes
      .nth(0)
      .evaluate((element) => getComputedStyle(element).transitionDuration)
    expect(
      reducedTransitionDurations
        .split(',')
        .every((duration) => Number.parseFloat(duration) <= 0.00001),
    ).toBe(true)
    await portugueseToggle.click()
    await expect(codes.nth(0)).toHaveCSS('font-size', '11px')
    await expect(codes.nth(0)).toHaveCSS('color', 'rgb(233, 233, 237)')
    await expect(codes.nth(1)).toHaveCSS('font-size', '9px')
    await expect(codes.nth(1)).toHaveCSS('color', 'rgb(98, 98, 110)')
  }
})

test('hover expansion, continuous motion, pause, drag and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.goto('/#/games')
  const rail = page.getByRole('region', { name: 'Selected work' })
  const first = rail.locator('li').first()
  const second = rail.locator('li').nth(1)
  const heightBefore = (await first.boundingBox())!.height
  const secondBefore = (await second.boundingBox())!.y
  await first.hover()
  await expect
    .poll(async () => (await first.boundingBox())!.height)
    .toBeGreaterThan(heightBefore + 20)
  expect((await second.boundingBox())!.y).toBeGreaterThan(secondBefore + 20)
  await page.mouse.move(10, 10)
  const track = page.locator('[data-carousel-track]')
  const getTransform = () => track.evaluate((element) => (element as HTMLElement).style.transform)
  const initial = await getTransform()
  await expect.poll(getTransform, { timeout: 6000 }).not.toBe(initial)
  await page.locator('h1').hover()
  const hovered = await getTransform()
  await page.waitForTimeout(250)
  expect(await getTransform()).toBe(hovered)
  await page.getByRole('button', { name: 'Pause automatic scrolling' }).click()
  await page.mouse.move(10, 10)
  const paused = await getTransform()
  await page.waitForTimeout(1200)
  expect(await getTransform()).toBe(paused)
  const viewport = page.locator('[data-carousel-viewport]')
  const box = (await viewport.boundingBox())!
  await page.mouse.move(box.x + 170, box.y + 40)
  await page.mouse.down()
  await page.mouse.move(box.x + 60, box.y + 40, { steps: 15 })
  await page.mouse.up()
  await expect(page).toHaveURL(/#\/games$/)
  await expect.poll(getTransform).not.toBe(paused)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await expect(page.getByRole('button', { name: 'Pause automatic scrolling' })).toHaveCount(0)
  await page.mouse.move(10, 10)
  const reduced = await getTransform()
  await page.waitForTimeout(1200)
  expect(await getTransform()).toBe(reduced)
  await page.goto('/#/misc')
  const miscCard = page.getByRole('region', { name: 'Selected work' }).locator('li').first()
  const widthBefore = (await miscCard.boundingBox())!.width
  await miscCard.hover()
  await expect
    .poll(async () => (await miscCard.boundingBox())!.width)
    .toBeGreaterThan(widthBefore + 20)
})

test('carousel stays paused during an outside drag and keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.goto('/#/games')
  const track = page.locator('[data-carousel-track]')
  const transform = () => track.evaluate((element) => (element as HTMLElement).style.transform)
  const offset = () =>
    track.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41)
  await page.mouse.move(10, 10)
  const initial = await transform()
  await expect.poll(transform, { timeout: 6000 }).not.toBe(initial)
  const box = (await page.locator('[data-carousel-viewport]').boundingBox())!
  await page.mouse.move(box.x + 170, box.y + 40)
  await page.mouse.down()
  await page.mouse.move(10, box.y + 40, { steps: 20 })
  await page.waitForTimeout(100)
  const held = await offset()
  await page.waitForTimeout(1200)
  expect(Math.abs((await offset()) - held)).toBeLessThan(1)
  await page.mouse.up()
  await expect(page).toHaveURL(/#\/games$/)
  await page.getByRole('link', { name: 'GitHub', exact: true }).focus()
  await expect
    .poll(async () => Math.abs((await offset()) - held), { timeout: 6000 })
    .toBeGreaterThan(2)
  await page.getByRole('button', { name: 'Next projects' }).focus()
  await page.waitForTimeout(100)
  const focused = await offset()
  await page.waitForTimeout(250)
  expect(Math.abs((await offset()) - focused)).toBeLessThan(1)
  await page.getByRole('link', { name: 'GitHub', exact: true }).focus()
  await expect
    .poll(async () => Math.abs((await offset()) - focused), { timeout: 6000 })
    .toBeGreaterThan(2)
  await page
    .locator('[data-carousel-viewport]')
    .getByRole('link', { name: 'Orbit', exact: true })
    .focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('h1')).toHaveText('Orbit')
})

test('touch scrolling does not open a project accidentally', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    hasTouch: true,
    isMobile: true,
  })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:5173/#/games')
  await page
    .getByRole('region', { name: 'Selected work' })
    .getByRole('link', { name: /Orbit/ })
    .tap()
  await expect(page.locator('h1')).toHaveText('Orbit')
  await page.getByRole('link', { name: 'Back to the journey' }).tap()
  await expect(page.locator('h1')).toContainText('Little worlds')
  const viewport = (await page.locator('[data-carousel-viewport]').boundingBox())!
  const session = await context.newCDPSession(page)
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: viewport.x + 250, y: viewport.y + 35 }],
  })
  for (let step = 1; step <= 8; step++)
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: viewport.x + 250 - step * 20, y: viewport.y + 35 }],
    })
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(page).toHaveURL(/#\/games$/)
  await context.close()
})
