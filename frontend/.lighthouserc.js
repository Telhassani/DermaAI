/**
 * Lighthouse CI Configuration
 * Performance, accessibility, SEO, and best practices testing
 */

module.exports = {
  ci: {
    collect: {
      // Test URLs
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/login',
        'http://localhost:3000/calendar',
      ],
      // Number of runs per URL
      numberOfRuns: 3,
      // Start server before testing
      startServerCommand: 'npm run dev',
      startServerReadyPattern: 'Ready',
      startServerReadyTimeout: 30000,
      settings: {
        // Skip waiting for full page load for faster tests
        skipAudits: ['uses-http2'],
      },
    },
    assert: {
      assertions: {
        // Performance budgets
        'categories:performance': ['error', { minScore: 0.7 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.85 }],
        'categories:seo': ['error', { minScore: 0.8 }],

        // Specific metrics
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 500 }],

        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'aria-roles': 'error',

        // SEO
        'meta-description': 'warn',
        'document-title': 'error',

        // Best practices
        'errors-in-console': 'warn',
        'uses-https': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
