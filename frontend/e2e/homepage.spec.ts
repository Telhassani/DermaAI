/**
 * E2E Tests - Homepage & Basic Navigation
 * Tests the critical path of homepage loading and basic navigation
 */

import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/')

    // Check that the page loads without errors
    await expect(page).toHaveTitle(/DermaAI|Dermatology/i)

    // Verify page is not showing critical error
    const errorTexts = await page.textContent('body')
    expect(errorTexts).not.toContain('Application error')
    expect(errorTexts).not.toContain('500')
  })

  test('should have working navigation', async ({ page }) => {
    await page.goto('/')

    // Wait for page to be interactive
    await page.waitForLoadState('networkidle')

    // Check that navigation elements exist
    const navExists = await page.locator('nav, header').count()
    expect(navExists).toBeGreaterThan(0)
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Page should still render properly
    await expect(page).toHaveTitle(/DermaAI|Dermatology/i)
  })

  test('should not have console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Should not have critical console errors
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes('favicon') && // Ignore favicon errors
        !error.includes('DevTools') && // Ignore DevTools warnings
        !error.includes('404') // Ignore 404 for optional resources
    )

    expect(criticalErrors.length).toBe(0)
  })
})
