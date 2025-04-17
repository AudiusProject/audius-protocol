import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react'

import { breakpoints } from '../foundations/breakpoints'

export type MediaContextType = {
  // Specific size breakpoint checks
  isExtraSmall: boolean // <= 480px
  isSmall: boolean // <= 768px
  isMedium: boolean // <= 1024px
  isLarge: boolean // <= 1280px
  isExtraLarge: boolean // <= 1440px

  // Specific "larger than" checks
  isAboveExtraSmall: boolean // > 480px
  isAboveSmall: boolean // > 768px
  isAboveMedium: boolean // > 1024px
  isAboveLarge: boolean // > 1280px
  isAboveExtraLarge: boolean // > 1440px

  // Common device categories
  isMobile: boolean // <= 768px
  isTablet: boolean // > 768px and <= 1024px
  isDesktop: boolean // > 1024px

  // Utility function for custom queries
  matchesQuery: (query: string) => boolean
}

const MediaContext = createContext<MediaContextType | null>(null)

type MediaProviderProps = {
  children: ReactNode
}

/**
 * Provider component that monitors media queries and makes responsive breakpoints
 * available throughout the app via context.
 */
export const MediaProvider = ({ children }: MediaProviderProps) => {
  // Initialize all the media state
  const [isExtraSmall, setIsExtraSmall] = useState(false)
  const [isSmall, setIsSmall] = useState(false)
  const [isMedium, setIsMedium] = useState(false)
  const [isLarge, setIsLarge] = useState(false)
  const [isExtraLarge, setIsExtraLarge] = useState(false)

  const [isAboveExtraSmall, setIsAboveExtraSmall] = useState(false)
  const [isAboveSmall, setIsAboveSmall] = useState(false)
  const [isAboveMedium, setIsAboveMedium] = useState(false)
  const [isAboveLarge, setIsAboveLarge] = useState(false)
  const [isAboveExtraLarge, setIsAboveExtraLarge] = useState(false)

  // Set up all the media query listeners at once
  useEffect(() => {
    // Helper to create and set up a media query listener
    const createMediaListener = (
      query: string,
      setter: (matches: boolean) => void
    ) => {
      const mql = window.matchMedia(query)

      // Set initial value
      setter(mql.matches)

      // Set up listener for changes
      const listener = (event: MediaQueryListEvent) => {
        setter(event.matches)
      }

      mql.addEventListener('change', listener)
      return () => mql.removeEventListener('change', listener)
    }

    // Set up all listeners
    const cleanupFunctions = [
      // Down queries
      createMediaListener(breakpoints.down.xs, setIsExtraSmall),
      createMediaListener(breakpoints.down.sm, setIsSmall),
      createMediaListener(breakpoints.down.md, setIsMedium),
      createMediaListener(breakpoints.down.lg, setIsLarge),
      createMediaListener(breakpoints.down.xl, setIsExtraLarge),

      // Up queries
      createMediaListener(breakpoints.up.xs, setIsAboveExtraSmall),
      createMediaListener(breakpoints.up.sm, setIsAboveSmall),
      createMediaListener(breakpoints.up.md, setIsAboveMedium),
      createMediaListener(breakpoints.up.lg, setIsAboveLarge),
      createMediaListener(breakpoints.up.xl, setIsAboveExtraLarge)
    ]

    // Clean up all listeners on unmount
    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [])

  // Derived properties
  const isMobile = isSmall // <= 768px
  const isTablet = !isSmall && !isAboveMedium // > 768px and <= 1024px
  const isDesktop = isAboveMedium // > 1024px

  // Utility function for custom queries
  const matchesQuery = (query: string) => {
    return window.matchMedia(query).matches
  }

  const value: MediaContextType = {
    isExtraSmall,
    isSmall,
    isMedium,
    isLarge,
    isExtraLarge,
    isAboveExtraSmall,
    isAboveSmall,
    isAboveMedium,
    isAboveLarge,
    isAboveExtraLarge,
    isMobile,
    isTablet,
    isDesktop,
    matchesQuery
  }

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>
}

/**
 * Hook to access media query state from the MediaContext.
 * This hook should be used instead of the original useMedia hook
 * to avoid creating multiple listeners in every component.
 */
export const useMedia = (): MediaContextType => {
  const context = useContext(MediaContext)

  if (context === null) {
    throw new Error('useMedia must be used within a MediaProvider')
  }

  return context
}
