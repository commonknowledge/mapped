'use client'

// @ts-ignore
import posthog from 'posthog-js'
import { useEffect } from 'react'
import * as CookieConsent from 'vanilla-cookieconsent'

export function ConsentRespectingPosthogAnalytics() {
  useEffect(() => {
    const updateConsent = () => {
      CookieConsent.acceptedCategory('analytics')
        ? acceptCookies()
        : declineCookies()
    }

    window.addEventListener('cc:onConsent', () => {
      updateConsent()
    })

    window.addEventListener('cc:onChange', () => {
      updateConsent()
    })
  }, [])

  return null
}

function acceptCookies() {
  posthog.opt_in_capturing()
}

function declineCookies() {
  posthog.opt_out_capturing()
}
