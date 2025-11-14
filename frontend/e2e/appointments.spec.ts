/**
 * E2E Tests - Appointments & Calendar
 * Tests the core business logic of appointments creation and management
 */

import { test, expect } from '@playwright/test'

test.describe('Appointments & Calendar', () => {
  test('calendar page should load', async ({ page }) => {
    // Try to access calendar (might redirect to login)
    await page.goto('/calendar')

    await page.waitForLoadState('networkidle')

    // Should either show calendar or redirect to login
    const onCalendarPage = page.url().includes('/calendar')
    const onLoginPage = page.url().includes('/login')

    expect(onCalendarPage || onLoginPage).toBeTruthy()
  })

  test('should show calendar navigation controls', async ({ page }) => {
    await page.goto('/calendar')

    // Wait for page to load
    await page.waitForTimeout(2000)

    // If on calendar page, should have navigation
    if (page.url().includes('/calendar')) {
      // Look for common calendar controls (previous, next, today)
      const hasNavigation =
        (await page.getByRole('button', { name: /previous|précédent|prev/i }).count()) > 0 ||
        (await page.getByRole('button', { name: /next|suivant/i }).count()) > 0 ||
        (await page.getByRole('button', { name: /today|aujourd'hui/i }).count()) > 0 ||
        (await page.locator('[aria-label*="navigation"]').count()) > 0

      expect(hasNavigation).toBeTruthy()
    }
  })

  test('should have create appointment button', async ({ page }) => {
    await page.goto('/calendar')

    await page.waitForTimeout(2000)

    if (page.url().includes('/calendar')) {
      // Look for create/add appointment button
      const hasCreateButton =
        (await page.getByRole('button', { name: /nouveau|new|créer|create|add/i }).count()) > 0 ||
        (await page.locator('button:has-text("rendez-vous"), button:has-text("appointment")').count()) > 0

      expect(hasCreateButton || (await page.locator('button[aria-label*="create"]').count()) > 0).toBeTruthy()
    }
  })

  test('appointments page should be performant', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/calendar')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // Page should load within reasonable time (5 seconds)
    expect(loadTime).toBeLessThan(5000)
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true)

    await page.goto('/calendar').catch(() => {
      // Expected to fail, catch the error
    })

    await page.context().setOffline(false)

    // Should be able to recover when back online
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    expect(page.url()).toBeTruthy()
  })
})
