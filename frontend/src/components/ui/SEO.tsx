/**
 * SEO Component
 * Manages meta tags and OpenGraph data
 */

import Head from 'next/head'
import { usePathname } from 'next/navigation'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  type?: 'website' | 'article' | 'profile'
  author?: string
  publishedTime?: string
  modifiedTime?: string
  noindex?: boolean
  canonical?: string
}

const DEFAULT_CONFIG = {
  siteName: 'DermaAI',
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://dermaai.com',
  defaultTitle: 'DermaAI - Cabinet Dermatologie Intelligent',
  defaultDescription:
    'Application SAAS pour la gestion de cabinet dermatologique avec intelligence artificielle. Gestion patients, consultations, prescriptions et analyse d\'images.',
  defaultImage: '/og-image.png',
  twitterHandle: '@dermaai',
}

export default function SEO({
  title,
  description = DEFAULT_CONFIG.defaultDescription,
  keywords = [],
  image = DEFAULT_CONFIG.defaultImage,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  noindex = false,
  canonical,
}: SEOProps) {
  const pathname = usePathname()

  // Construct full title
  const fullTitle = title
    ? `${title} | ${DEFAULT_CONFIG.siteName}`
    : DEFAULT_CONFIG.defaultTitle

  // Construct full URL
  const fullUrl = canonical || `${DEFAULT_CONFIG.baseUrl}${pathname || ''}`

  // Construct image URL
  const imageUrl = image.startsWith('http')
    ? image
    : `${DEFAULT_CONFIG.baseUrl}${image}`

  // Default keywords
  const defaultKeywords = [
    'dermatologie',
    'saas médical',
    'intelligence artificielle',
    'cabinet médical',
    'gestion patients',
    'telemedicine',
  ]

  const allKeywords = [...defaultKeywords, ...keywords].join(', ')

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords} />
      {author && <meta name="author" content={author} />}

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content={DEFAULT_CONFIG.siteName} />
      <meta property="og:locale" content="fr_FR" />

      {/* Article specific */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={DEFAULT_CONFIG.twitterHandle} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="theme-color" content="#ffffff" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />

      {/* Favicons */}
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </Head>
  )
}

/**
 * JSON-LD Structured Data Component
 */
interface JSONLDProps {
  type: 'Organization' | 'WebSite' | 'MedicalOrganization' | 'Person'
  data: Record<string, any>
}

export function JSONLD({ type, data }: JSONLDProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

/**
 * Organization Schema
 */
export function OrganizationSchema() {
  return (
    <JSONLD
      type="MedicalOrganization"
      data={{
        name: 'DermaAI',
        description: DEFAULT_CONFIG.defaultDescription,
        url: DEFAULT_CONFIG.baseUrl,
        logo: `${DEFAULT_CONFIG.baseUrl}/logo.png`,
        sameAs: [
          // Add social media URLs
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: 'contact@dermaai.com',
        },
      }}
    />
  )
}
