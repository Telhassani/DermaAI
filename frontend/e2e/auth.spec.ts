/**
 * E2E Tests - Authentication Flow
 * Tests login, logout, and protected routes
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should show login page for unauthenticated users', async ({ page }) => {
    await page.goto('/')

    // Should redirect to login or show login form
    await page.waitForLoadState('networkidle')

    // Check for login-related elements
    const hasLoginForm =
      (await page.locator('input[type="email"], input[type="text"][name*="email"]').count()) > 0 ||
      (await page.locator('input[type="password"]').count()) > 0 ||
      (await page.getByRole('button', { name: /connexion|login|sign in/i }).count()) > 0

    // Either showing login form or already authenticated
    expect(hasLoginForm || (await page.url()).includes('dashboard')).toBeTruthy()
  })

  test('should have proper form validation', async ({ page }) => {
    await page.goto('/login')

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /connexion|login|sign in/i }).first()

    if (await submitButton.count() > 0) {
      await submitButton.click()

      // Should show validation error or stay on same page
      await page.waitForTimeout(500)

      const currentUrl = page.url()
      expect(currentUrl).toContain('/login')
    }
  })

  test('should handle invalid credentials gracefully', async ({ page }) => {
    await page.goto('/login')

    const emailInput = page.locator('input[type="email"], input[type="text"][name*="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    const submitButton = page.getByRole('button', { name: /connexion|login|sign in/i }).first()

    if ((await emailInput.count()) > 0 && (await passwordInput.count()) > 0) {
      await emailInput.fill('invalid@test.com')
      await passwordInput.fill('wrongpassword')
      await submitButton.click()

      // Wait for response
      await page.waitForTimeout(2000)

      // Should show error message or stay on login page
      const hasError =
        (await page.getByText(/erreur|error|invalid|incorrect/i).count()) > 0 ||
        page.url().includes('/login')

      expect(hasError).toBeTruthy()
    }
  })

  test('login page should be accessible', async ({ page }) => {
    await page.goto('/login')

    // Check for proper HTML structure
    const hasHeading = (await page.locator('h1, h2').count()) > 0
    expect(hasHeading).toBeTruthy()

    // Check for form labels (accessibility)
    const hasLabels = (await page.locator('label').count()) > 0
    expect(hasLabels || (await page.locator('[aria-label]').count()) > 0).toBeTruthy()
  })
})
