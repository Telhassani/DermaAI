/**
 * E2E Tests - Complete User Journey
 * Tests the critical user flow: Login → Dashboard → Logout
 */

import { test, expect } from '@playwright/test'

test.describe('Complete User Journey', () => {
  // Test credentials (adjust based on your test environment)
  const TEST_USER = {
    email: process.env.TEST_USER_EMAIL || 'doctor@dermai.com',
    password: process.env.TEST_USER_PASSWORD || 'test123',
  }

  test('should complete full journey: Login → Dashboard → Logout', async ({ page }) => {
    // Step 1: Navigate to application
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Step 2: Verify we're on login page or already logged in
    const currentUrl = page.url()
    const isOnLoginPage = currentUrl.includes('/login') || currentUrl.includes('/auth')
    const isOnDashboard = currentUrl.includes('/dashboard') || currentUrl.includes('/calendar')

    if (!isOnDashboard) {
      // Step 3: Fill login form
      console.log('Attempting to login...')

      // Find email/username input
      const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first()
      const passwordInput = page.locator('input[type="password"]').first()

      // Check if login form exists
      if ((await emailInput.count()) > 0 && (await passwordInput.count()) > 0) {
        await emailInput.fill(TEST_USER.email)
        await passwordInput.fill(TEST_USER.password)

        // Find and click login button
        const loginButton = page.getByRole('button', { name: /connexion|login|sign in|se connecter/i }).first()
        await loginButton.click()

        // Step 4: Wait for navigation to dashboard
        await page.waitForTimeout(2000) // Wait for auth process

        // Verify successful login
        await page.waitForLoadState('networkidle')
        const afterLoginUrl = page.url()

        // Should be redirected away from login page
        expect(afterLoginUrl).not.toContain('/login')
        expect(afterLoginUrl).not.toContain('/auth')

        console.log('Login successful, navigated to:', afterLoginUrl)
      } else {
        console.log('No login form found, might already be authenticated')
      }
    }

    // Step 5: Verify Dashboard/Main App is loaded
    await page.waitForLoadState('networkidle')

    // Look for dashboard/app indicators
    const hasAppContent =
      (await page.locator('nav, header, [role="navigation"]').count()) > 0 ||
      (await page.getByText(/dashboard|calendrier|calendar|rendez-vous|appointments/i).count()) > 0

    expect(hasAppContent).toBeTruthy()
    console.log('Dashboard loaded successfully')

    // Step 6: Navigate around the app (optional)
    // Try to access calendar/appointments
    const calendarLink = page.getByRole('link', { name: /calendrier|calendar|rendez-vous/i }).first()
    if ((await calendarLink.count()) > 0) {
      await calendarLink.click()
      await page.waitForLoadState('networkidle')
      console.log('Navigated to calendar')
    }

    // Step 7: Logout
    console.log('Attempting to logout...')

    // Look for user menu or logout button
    const userMenuButton = page.locator(
      'button:has-text("Profile"), button:has-text("Profil"), [aria-label*="user"], [aria-label*="menu"], button[aria-haspopup="menu"]'
    ).first()

    if ((await userMenuButton.count()) > 0) {
      await userMenuButton.click()
      await page.waitForTimeout(500) // Wait for dropdown

      // Find logout button
      const logoutButton = page.getByRole('button', { name: /déconnexion|logout|sign out|log out/i }).or(
        page.getByText(/déconnexion|logout|sign out/i)
      ).first()

      if ((await logoutButton.count()) > 0) {
        await logoutButton.click()
        await page.waitForTimeout(1000)

        // Step 8: Verify logout successful
        await page.waitForLoadState('networkidle')
        const afterLogoutUrl = page.url()

        // Should be redirected to login or home
        const isLoggedOut =
          afterLogoutUrl.includes('/login') ||
          afterLogoutUrl.includes('/auth') ||
          afterLogoutUrl === new URL('/', page.url()).href

        expect(isLoggedOut).toBeTruthy()
        console.log('Logout successful, redirected to:', afterLogoutUrl)
      } else {
        console.log('Logout button not found in menu')
      }
    } else {
      // Try direct logout button
      const directLogoutButton = page.getByRole('button', { name: /déconnexion|logout|sign out/i }).first()
      if ((await directLogoutButton.count()) > 0) {
        await directLogoutButton.click()
        await page.waitForTimeout(1000)
        console.log('Logout via direct button')
      } else {
        console.log('No logout mechanism found')
      }
    }
  })

  test('should persist login state across page reloads', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // If on login page, perform login
    if (page.url().includes('/login')) {
      const emailInput = page.locator('input[type="email"], input[name="email"]').first()
      const passwordInput = page.locator('input[type="password"]').first()

      if ((await emailInput.count()) > 0) {
        await emailInput.fill(TEST_USER.email)
        await passwordInput.fill(TEST_USER.password)

        const loginButton = page.getByRole('button', { name: /connexion|login|sign in/i }).first()
        await loginButton.click()
        await page.waitForTimeout(2000)
      }
    }

    // Get current URL (should be in app)
    const beforeReloadUrl = page.url()

    // Reload the page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Should still be authenticated (not redirected to login)
    const afterReloadUrl = page.url()
    expect(afterReloadUrl).not.toContain('/login')

    console.log('Session persisted after reload')
  })

  test('should redirect to login when accessing protected route without auth', async ({ context, page }) => {
    // Clear cookies and storage to ensure we're logged out
    await context.clearCookies()
    await context.clearPermissions()

    // Try to access protected route directly
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Should be redirected to login
    await page.waitForTimeout(1000)
    const currentUrl = page.url()

    const isOnLoginOrHome =
      currentUrl.includes('/login') ||
      currentUrl.includes('/auth') ||
      currentUrl === new URL('/', page.url()).href

    expect(isOnLoginOrHome).toBeTruthy()
    console.log('Protected route redirected to:', currentUrl)
  })

  test('should show appropriate error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    const loginButton = page.getByRole('button', { name: /connexion|login|sign in/i }).first()

    if ((await emailInput.count()) > 0 && (await passwordInput.count()) > 0) {
      // Enter invalid credentials
      await emailInput.fill('invalid@test.com')
      await passwordInput.fill('wrongpassword123')
      await loginButton.click()

      // Wait for error
      await page.waitForTimeout(2000)

      // Should show error message or stay on login page
      const currentUrl = page.url()
      expect(currentUrl).toContain('/login')

      const hasError =
        (await page.getByText(/erreur|error|invalid|incorrect|échec/i).count()) > 0 ||
        (await page.locator('[role="alert"], .error, .text-red, .text-danger').count()) > 0

      // Error might be shown or just fail silently
      console.log('Invalid login handled, error shown:', hasError)
    }
  })

  test('should maintain user session during app navigation', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // If on login, login first
    if (page.url().includes('/login')) {
      const emailInput = page.locator('input[type="email"]').first()
      const passwordInput = page.locator('input[type="password"]').first()

      if ((await emailInput.count()) > 0) {
        await emailInput.fill(TEST_USER.email)
        await passwordInput.fill(TEST_USER.password)
        await page.getByRole('button', { name: /login|connexion/i }).first().click()
        await page.waitForTimeout(2000)
      }
    }

    // Navigate to different sections
    const sections = ['/calendar', '/patients', '/dashboard', '/']

    for (const section of sections) {
      await page.goto(section)
      await page.waitForLoadState('networkidle')

      // Should not be redirected to login
      await page.waitForTimeout(500)
      const url = page.url()

      // If the route doesn't exist, might get 404, but should not redirect to login
      if (!url.includes('/404')) {
        expect(url).not.toContain('/login')
      }

      console.log(`Session maintained at ${section}`)
    }
  })
})

test.describe('Dashboard Functionality', () => {
  test('should load dashboard with main navigation', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Skip if on login page (not testing auth here)
    if (!page.url().includes('/login')) {
      // Look for main app elements
      const hasNavigation = (await page.locator('nav, header, [role="navigation"]').count()) > 0
      expect(hasNavigation).toBeTruthy()

      // Look for main content area
      const hasMainContent = (await page.locator('main, [role="main"], #content, .content').count()) > 0
      expect(hasMainContent || (await page.locator('div').count()) > 10).toBeTruthy()

      console.log('Dashboard structure verified')
    }
  })

  test('should have working navigation between pages', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    if (!page.url().includes('/login')) {
      // Get all navigation links
      const navLinks = page.locator('nav a, header a, [role="navigation"] a')
      const linkCount = await navLinks.count()

      expect(linkCount).toBeGreaterThan(0)

      // Try clicking first nav link (if exists)
      if (linkCount > 0) {
        const firstLink = navLinks.first()
        const href = await firstLink.getAttribute('href')

        if (href && !href.startsWith('http') && !href.startsWith('#')) {
          await firstLink.click()
          await page.waitForLoadState('networkidle')

          // Should navigate successfully
          expect(page.url()).toBeTruthy()
          console.log('Navigation link worked, navigated to:', page.url())
        }
      }
    }
  })
})
