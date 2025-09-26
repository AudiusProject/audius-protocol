import { useCallback } from 'react'

import { useAppContext } from '~/context/appContext'
import { AnalyticsEvent, AllTrackingEvents } from '~/models/Analytics'

/**
 * Core analytics hook providing a consistent interface for tracking events
 * across the application. This hook abstracts the analytics implementation
 * and provides type-safe event tracking.
 */
export const useAnalytics = () => {
  const { analytics } = useAppContext()

  /**
   * Track an analytics event
   * @param event - The event to track (can be created with make() or passed directly)
   * @param callback - Optional callback to execute after tracking
   */
  const track = useCallback(
    async (event: AnalyticsEvent, callback?: () => void) => {
      console.log('track', event)
      return analytics.track(event, callback)
    },
    [analytics]
  )

  /**
   * Create an analytics event object from a typed event
   * @param event - Typed event object
   * @returns Analytics event ready for tracking
   */
  const make = useCallback(
    <T extends AllTrackingEvents>(event: T) => {
      return analytics.make(event)
    },
    [analytics]
  )

  /**
   * Convenience method to create and track an event in one call
   * @param event - Typed event object
   * @param callback - Optional callback to execute after tracking
   */
  const trackEvent = useCallback(
    async <T extends AllTrackingEvents>(event: T, callback?: () => void) => {
      const analyticsEvent = analytics.make(event)
      return analytics.track(analyticsEvent, callback)
    },
    [analytics]
  )

  return {
    track,
    make,
    trackEvent
  }
}
