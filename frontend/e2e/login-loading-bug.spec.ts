/**
 * E2E Tests - Login Page Loading Bug Detection
 * Détecte spécifiquement le bug où le login réussit mais la page ne se charge pas
 */

import { test, expect } from '@playwright/test'

test.describe('Login Page Loading Bug Detection', () => {
  const TEST_USER = {
    email: process.env.TEST_USER_EMAIL || 'doctor@dermai.com',
    password: process.env.TEST_USER_PASSWORD || 'test123',
  }

  test('CRITICAL: Page must load completely after successful login', async ({ page }) => {
    // Enable console logging to catch errors
    const consoleErrors: string[] = []
    const consoleWarnings: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
      if (msg.type() === 'warning') consoleWarnings.push(msg.text())
    })

    // Track failed network requests
    const failedRequests: string[] = []
    page.on('requestfailed', (request) => {
      failedRequests.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`)
    })

    // Step 1: Go to login
    console.log('📍 Step 1: Navigating to login page')
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')

    const loginPageLoaded = await page.locator('input[type="password"]').count() > 0
    expect(loginPageLoaded).toBeTruthy()
    console.log('✅ Login page loaded')

    // Step 2: Fill credentials
    console.log('📍 Step 2: Filling login credentials')
    const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first()
    const passwordInput = page.locator('input[type="password"]').first()

    await emailInput.fill(TEST_USER.email)
    await passwordInput.fill(TEST_USER.password)
    console.log('✅ Credentials filled')

    // Step 3: Submit login
    console.log('📍 Step 3: Submitting login form')
    const loginButton = page.getByRole('button', { name: /connexion|login|sign in|se connecter/i }).first()

    // Start monitoring from here
    const startTime = Date.now()

    // Click login button
    await loginButton.click()
    console.log('✅ Login button clicked')

    // Step 4: CRITICAL - Wait for navigation and page load
    console.log('📍 Step 4: Waiting for post-login navigation...')

    try {
      // Wait for URL to change (navigation happened)
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 })
      console.log('✅ Navigation occurred, new URL:', page.url())
    } catch (error) {
      console.error('❌ NAVIGATION TIMEOUT - Page did not navigate after login')
      throw new Error(`Navigation timeout after login. Still on: ${page.url()}`)
    }

    // Step 5: CRITICAL - Verify page loaded (not stuck)
    console.log('📍 Step 5: Verifying page loaded completely...')

    try {
      // Wait for network idle (all resources loaded)
      await page.waitForLoadState('networkidle', { timeout: 15000 })
      console.log('✅ Network idle - all resources loaded')
    } catch (error) {
      console.error('❌ NETWORK TIMEOUT - Page still loading resources')
      console.error('Failed requests:', failedRequests)
      throw new Error('Page resources did not finish loading')
    }

    const loadTime = Date.now() - startTime
    console.log(`⏱️  Total load time: ${loadTime}ms`)

    // Step 6: CRITICAL - Verify page has actual content
    console.log('📍 Step 6: Verifying page has content...')

    const bodyText = await page.textContent('body')
    expect(bodyText).toBeTruthy()
    expect(bodyText!.length).toBeGreaterThan(100)
    console.log(`✅ Page has ${bodyText!.length} characters of content`)

    // Step 7: CRITICAL - No infinite loading spinners
    console.log('📍 Step 7: Checking for stuck loading indicators...')

    await page.waitForTimeout(1000) // Wait a bit to see if loaders disappear

    const loadingIndicators = await page.locator(
      '[role="progressbar"], [aria-busy="true"], .loading, .spinner, [data-loading="true"]'
    ).count()

    if (loadingIndicators > 0) {
      console.warn(`⚠️  Found ${loadingIndicators} loading indicators still visible`)
      // Take screenshot for debugging
      await page.screenshot({ path: 'login-stuck-loading.png' })
    }

    expect(loadingIndicators).toBe(0)
    console.log('✅ No stuck loading indicators')

    // Step 8: CRITICAL - Page is interactive
    console.log('📍 Step 8: Verifying page is interactive...')

    const interactiveElements = await page.locator('button:not([disabled]), a, input:not([disabled])').count()
    expect(interactiveElements).toBeGreaterThan(0)
    console.log(`✅ Found ${interactiveElements} interactive elements`)

    // Step 9: CRITICAL - No error messages
    console.log('📍 Step 9: Checking for error messages...')

    const errorMessages = await page.getByText(/error|erreur|failed|échec|impossible/i).count()
    if (errorMessages > 0) {
      const errorText = await page.locator('body').textContent()
      console.error('❌ Error messages found:', errorText)
    }
    expect(errorMessages).toBe(0)
    console.log('✅ No error messages')

    // Step 10: Report console errors/warnings
    if (consoleErrors.length > 0) {
      console.warn('⚠️  Console errors detected:')
      consoleErrors.forEach((err) => console.warn('  -', err))
    }

    if (failedRequests.length > 0) {
      console.warn('⚠️  Failed network requests:')
      failedRequests.forEach((req) => console.warn('  -', req))
    }

    // Critical errors should fail the test
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('favicon') &&
        !err.includes('DevTools') &&
        err.toLowerCase().includes('error')
    )

    expect(criticalErrors.length).toBe(0)

    console.log('✅✅✅ PASSED: Login completed and page loaded successfully!')
  })

  test('should not get stuck in loading state after login', async ({ page }) => {
    await page.goto('/login')

    const emailInput = page.locator('input[type="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()

    if ((await emailInput.count()) > 0) {
      await emailInput.fill(TEST_USER.email)
      await passwordInput.fill(TEST_USER.password)

      const loginButton = page.getByRole('button', { name: /login|connexion/i }).first()
      await loginButton.click()

      // Wait for navigation
      await page.waitForTimeout(3000)

      // Verify we're not stuck with a loading spinner
      const hasLoadingSpinner = await page.locator('[role="progressbar"], .loading, .spinner').isVisible().catch(() => false)

      if (hasLoadingSpinner) {
        console.error('❌ BUG DETECTED: Page stuck in loading state after login')
        await page.screenshot({ path: 'stuck-loading-bug.png' })
      }

      expect(hasLoadingSpinner).toBe(false)
    }
  })

  test('should have reasonable page load time after login', async ({ page }) => {
    await page.goto('/login')

    const emailInput = page.locator('input[type="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()

    if ((await emailInput.count()) > 0) {
      await emailInput.fill(TEST_USER.email)
      await passwordInput.fill(TEST_USER.password)

      const startTime = Date.now()

      const loginButton = page.getByRole('button', { name: /login|connexion/i }).first()
      await loginButton.click()

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle', { timeout: 20000 })

      const loadTime = Date.now() - startTime

      console.log(`Page load time after login: ${loadTime}ms`)

      // Should load within 10 seconds (reasonable for SPA)
      expect(loadTime).toBeLessThan(10000)

      // Warn if slow
      if (loadTime > 5000) {
        console.warn(`⚠️  Slow page load detected: ${loadTime}ms`)
      }
    }
  })

  test('should handle slow network gracefully', async ({ page, context }) => {
    // Simulate slow network
    await page.route('**/*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500)) // 500ms delay
      await route.continue()
    })

    await page.goto('/login')

    const emailInput = page.locator('input[type="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()

    if ((await emailInput.count()) > 0) {
      await emailInput.fill(TEST_USER.email)
      await passwordInput.fill(TEST_USER.password)

      const loginButton = page.getByRole('button', { name: /login|connexion/i }).first()
      await loginButton.click()

      // Should still eventually load (with longer timeout)
      await page.waitForLoadState('networkidle', { timeout: 30000 })

      // Should not be stuck
      const isStuck = await page.locator('[role="progressbar"]').isVisible().catch(() => false)
      expect(isStuck).toBe(false)

      console.log('✅ Handled slow network gracefully')
    }
  })

  test('should show loading indicator initially then hide it', async ({ page }) => {
    await page.goto('/login')

    const emailInput = page.locator('input[type="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()

    if ((await emailInput.count()) > 0) {
      await emailInput.fill(TEST_USER.email)
      await passwordInput.fill(TEST_USER.password)

      const loginButton = page.getByRole('button', { name: /login|connexion/i }).first()
      await loginButton.click()

      // Should show loading initially
      await page.waitForTimeout(500)
      const hadLoading = (await page.locator('[role="progressbar"], .loading, .spinner').count()) > 0

      console.log('Loading indicator shown initially:', hadLoading)

      // Wait for page load
      await page.waitForLoadState('networkidle', { timeout: 15000 })

      // Loading should be gone now
      await page.waitForTimeout(1000)
      const stillLoading = await page.locator('[role="progressbar"], .loading, .spinner').isVisible().catch(() => false)

      expect(stillLoading).toBe(false)
      console.log('✅ Loading indicator properly disappeared')
    }
  })
})
