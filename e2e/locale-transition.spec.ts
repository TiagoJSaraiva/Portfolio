import { expect, test } from '@playwright/test'

for (const width of [360, 768, 1440]) {
  test(`language transition completes on the landing page at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.clock.install({ time: new Date('2026-10-10T12:00:00Z') })
    await page.clock.pauseAt(new Date('2026-10-10T12:00:01Z'))
    await page.goto('/')
    await page.clock.runFor(100)

    const languageButton = page.locator('header button')
    for (const target of ['pt-BR', 'en']) {
      await languageButton.focus()
      await page.keyboard.press('Enter')
      await page.keyboard.press('Enter')
      await expect(languageButton).toHaveAttribute('aria-disabled', 'true')
      await page.clock.runFor(150)
      await expect(page.locator('html')).toHaveAttribute('lang', target)
      await expect(page.locator('[data-locale-letter]').first()).toBeAttached()
      await page.clock.runFor(450)
      await expect(page.locator('[data-locale-phase]')).toHaveCount(0)
      await expect(languageButton).not.toHaveAttribute('aria-disabled')
      await expect.poll(() => page.evaluate(() => window.location.hash || '#/')).toBe('#/')
      await expect(page.locator('h1')).toHaveAttribute('aria-label', 'Tiago Saraiva')
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true)
    }
  })
}

test('category navigation and reduced motion preserve language switching', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const games = page.getByRole('button', { name: 'Games', exact: true })
  await games.focus()
  await page.keyboard.press('Enter')
  await expect.poll(() => page.evaluate(() => window.location.hash || '#/')).toBe('#/games')

  await page.getByRole('button', { name: 'Change language to Portuguese' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
  await expect(page.getByRole('heading', { level: 1, name: 'Jogos', exact: true })).toBeAttached()
  await page.getByRole('button', { name: 'Voltar ao início' }).click()
  await expect(page.getByRole('button', { name: 'Jogos', exact: true })).toBeFocused()
  await expect(page.locator('[data-locale-phase]')).toHaveCount(0)
})

test('unsupported project URLs still redirect to the landing page', async ({ page }) => {
  for (const route of ['/games/orbit', '/web/atlas', '/unknown']) {
    await page.goto(`/#${route}`)
    await expect.poll(() => page.evaluate(() => window.location.hash || '#/')).toBe('#/')
    await expect(page.locator('h1')).toHaveAttribute('aria-label', 'Tiago Saraiva')
    await expect(page.getByRole('button', { name: 'Change language to Portuguese' })).toBeVisible()
  }
})
