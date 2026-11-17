import { expect, test } from '@playwright/test'

test('opens the workshop landing page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'El Buzón de las Historias' })).toBeVisible()
  await expect(page.getByText('Cada voz construye nuestra historia')).toBeVisible()
})
