// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
  tracesSampleRate: 1,
  debug: false,

  beforeSend(event) {
    if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
      return null
    }
    return event
  },

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: process.env.NEXT_PUBLIC_ENVIRONMENT === 'development',
})
