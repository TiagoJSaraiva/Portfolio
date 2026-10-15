import { expect, test } from '@playwright/test'

for (const width of [360, 768, 1440]) {
  test(`landing, categories and direct navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 })
    await page.emulateMedia({ reducedMotion: 'reduce' })

    await page.goto('/')
    await expect(page.locator('h1')).toHaveAttribute('aria-label', 'Tiago Saraiva')
    await expect.poll(() => page.evaluate(() => window.location.hash || '#/')).toBe('#/')
    await expect(page.getByRole('button', { name: 'Games', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Web Projects', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Misc', exact: true })).toBeVisible()
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true)

    await expect(page.locator('footer')).toHaveCount(0)
    await expect(page.locator('header a[href="#/"]')).toHaveCount(0)
    await page.screenshot({ path: `test-results/screenshots/${width}-home.png`, fullPage: true })
    for (const [id, label] of [
      ['games', 'Games'],
      ['web', 'Web Projects'],
      ['misc', 'Misc'],
    ]) {
      await page
        .getByRole('button', { name: label, exact: true })
        .getByText(label, { exact: true })
        .click()
      await expect.poll(() => page.evaluate(() => window.location.hash)).toBe(`#/${id}`)
      await expect(page.locator('[data-transition-phase]')).toHaveAttribute(
        'data-transition-phase',
        'ready',
      )
      await expect(page.getByRole('heading', { level: 1, name: label })).toBeAttached()
      await expect(page.getByRole('heading', { level: 2 })).toHaveCount(4)
      await expect(page.getByRole('button', { name: 'Pause automatic scrolling' })).toHaveCount(0)
      if (id === 'games') {
        const card = page.locator('[data-project-id="multiverse-heroes"]').first()
        const background = card.locator('img').nth(0)
        const logo = card.locator('img').nth(1)
        await expect(background).toHaveAttribute('src', /MultiverseHeroes\/bg\.png/)
        await expect(logo).toHaveAttribute('src', /MultiverseHeroes\/logo\.png/)
        await expect(logo).toHaveCSS('height', '64px')
        await expect(
          card.getByRole('link', { name: 'View on GitHub — Multiverse Heroes' }),
        ).toHaveAttribute('href', 'https://github.com/TiagoJSaraiva/Roblox-Game')
        await expect(
          card.getByRole('link', { name: 'Open project — Multiverse Heroes' }),
        ).toHaveAttribute(
          'href',
          'https://www.roblox.com/pt/games/82513593943496/Multiverse-Heroes',
        )
        const centered = await card.evaluate((element) => {
          const cardRect = element.getBoundingClientRect()
          const logoRect = element.querySelectorAll('img')[1]!.getBoundingClientRect()
          return (
            Math.abs(logoRect.x + logoRect.width / 2 - (cardRect.x + cardRect.width / 2)) < 1 &&
            Math.abs(logoRect.y + logoRect.height / 2 - (cardRect.y + cardRect.height / 2)) < 1
          )
        })
        expect(centered).toBe(true)
        const contentLayout = await card.evaluate((element) => {
          const logoRect = element.querySelectorAll('img')[1]!.getBoundingClientRect()
          const content = element.children[1]!
          const textRects = [
            content.querySelector('h2')!.getBoundingClientRect(),
            content.querySelector('a')!.parentElement!.getBoundingClientRect(),
          ]
          const contentClear = textRects.every(
            (rect) =>
              logoRect.right <= rect.left ||
              logoRect.left >= rect.right ||
              logoRect.bottom <= rect.top ||
              logoRect.top >= rect.bottom,
          )
          return {
            contentClear,
            logo: { x: logoRect.x, y: logoRect.y, width: logoRect.width, height: logoRect.height },
            text: textRects.map(({ x, y, width, height }) => ({ x, y, width, height })),
          }
        })
        expect(contentLayout.contentClear).toBe(true)
        await expect(
          page.locator('[data-project-id="neon-rush"]').first().locator('[role="img"]'),
        ).toHaveAttribute('aria-label', 'Preview coming soon')
        await expect(
          page.locator('[data-project-id="neon-rush"]').first().locator('[role="img"]'),
        ).toHaveCSS('display', 'flex')
      } else {
        await expect(page.getByRole('img', { name: 'Preview coming soon' })).toHaveCount(4)
        await expect(page.locator('article[data-project-id] a')).toHaveCount(0)
      }
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true)
      await page.screenshot({ path: `test-results/screenshots/${width}-${id}.png`, fullPage: true })
      await page.getByRole('button', { name: 'Back to home' }).click()
      await expect(page.getByRole('button', { name: label, exact: true })).toBeFocused()
      await page.goto(`/#/${id}`)
      await expect(page.locator('[data-transition-phase]')).toHaveAttribute(
        'data-transition-phase',
        'ready',
      )
      await expect(page.getByRole('heading', { level: 2 })).toHaveCount(4)
      await page.reload()
      await expect(page.locator('[data-flying-icon]')).toHaveCount(0)
      await page.getByRole('button', { name: 'Back to home' }).click()
    }
  })
}

test('language changes and persists across category navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const games = page.getByRole('button', { name: 'Games', exact: true })
  await games.focus()
  await page.keyboard.press('Enter')
  await expect.poll(() => page.evaluate(() => window.location.hash)).toBe('#/games')

  await page.getByRole('button', { name: 'Change language to Portuguese' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
  await expect(page.getByRole('heading', { level: 1, name: 'Jogos', exact: true })).toBeAttached()
  await expect.poll(() => page.evaluate(() => window.location.hash)).toBe('#/games')
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('tiago-portfolio-locale')))
    .toBe('pt')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
  await expect(page.getByRole('button', { name: 'Voltar ao início' })).toBeVisible()
  await page.getByRole('button', { name: 'Voltar ao início' }).click()
  await expect(page.getByRole('button', { name: 'Projetos Web', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Jogos', exact: true })).toBeVisible()
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
