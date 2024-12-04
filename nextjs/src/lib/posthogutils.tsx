import posthog from 'posthog-js'

export const triggerAnalyticsEvent = (eventName: string, properties = {}) => {
  posthog.capture(eventName, properties)
}
