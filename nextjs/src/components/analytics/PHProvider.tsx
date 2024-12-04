'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

// Utility function to initialize a new PostHog instance
const initializePosthog = (
  apiKey: string,
  apiHost: string,
  options: object
) => {
  const instance = posthog.init(apiKey, {
    api_host: apiHost,
    ...options,
  })
  return instance
}

export default function PHProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'production') {
        const specificDomain = 'peopleclimatenature.org'
        if (window.location.hostname === specificDomain) {
          // If domain matches initialize the secondary PostHog instance for The Climate Coalition
          const secondaryInstance = initializePosthog(
            process.env.NEXT_PUBLIC_POSTHOG_KEY_SECONDARY!,
            process.env.NEXT_PUBLIC_POSTHOG_HOST!,
            // Auto collect events for TCC
            { capture_pageview: true, autocapture: true }
          )
        } else {
          // Initialize the main PostHog instance
          const mainInstance = initializePosthog(
            process.env.NEXT_PUBLIC_POSTHOG_KEY_MAIN!,
            process.env.NEXT_PUBLIC_POSTHOG_HOST!,
            { capture_pageview: false, autocapture: false }
          )
        }
      }
    }
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
