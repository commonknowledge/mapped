'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import * as CookieConsent from 'vanilla-cookieconsent'

export default function ConsentRespectingGoogleAnalytics({
  googleAnalyticsTagId,
}: {
  googleAnalyticsTagId: string
}) {
  useEffect(() => {
    // @ts-ignore
    window.dataLayer = window.dataLayer || []
    function gtag(...args: any[]) {
      // @ts-ignore
      window.dataLayer?.push(arguments)
    }
    gtag('js', new Date())
    gtag('config', googleAnalyticsTagId)

    gtag?.('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted',
    })

    const updateGtagConsent = () => {
      // @ts-ignore
      gtag?.('consent', 'update', {
        ad_storage: CookieConsent.acceptedCategory('advertisement')
          ? 'granted'
          : 'denied',
        ad_user_data: CookieConsent.acceptedCategory('advertisement')
          ? 'granted'
          : 'denied',
        ad_personalization: CookieConsent.acceptedCategory('advertisement')
          ? 'granted'
          : 'denied',
        analytics_storage: CookieConsent.acceptedCategory('analytics')
          ? 'granted'
          : 'denied',
        functionality_storage: CookieConsent.acceptedCategory('functional')
          ? 'granted'
          : 'denied',
        personalization_storage: CookieConsent.acceptedCategory('functional')
          ? 'granted'
          : 'denied',
        security_storage: 'granted', //necessary
      })
    }

    window.addEventListener('cc:onConsent', () => {
      updateGtagConsent()
    })

    window.addEventListener('cc:onChange', () => {
      updateGtagConsent()
    })
  }, [googleAnalyticsTagId])

  return (
    <Script
      type="text/plain"
      data-category="analytics"
      data-service="Google Analytics"
      strategy="afterInteractive"
      data-src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsTagId}`}
    />
  )
}
