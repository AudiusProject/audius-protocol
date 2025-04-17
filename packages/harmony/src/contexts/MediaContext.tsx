import { createContext, useContext, ReactNode, useMemo } from 'react'

import { useMedia as useMediaQuery } from 'react-use'

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
  // Use react-use's useMedia hook for each breakpoint query
  const isExtraSmall = useMediaQuery(breakpoints.down.xs)
  const isSmall = useMediaQuery(breakpoints.down.sm)
  const isMedium = useMediaQuery(breakpoints.down.md)
  const isLarge = useMediaQuery(breakpoints.down.lg)
  const isExtraLarge = useMediaQuery(breakpoints.down.xl)

  const isAboveExtraSmall = useMediaQuery(breakpoints.up.xs)
  const isAboveSmall = useMediaQuery(breakpoints.up.sm)
  const isAboveMedium = useMediaQuery(breakpoints.up.md)
  const isAboveLarge = useMediaQuery(breakpoints.up.lg)
  const isAboveExtraLarge = useMediaQuery(breakpoints.up.xl)

  // Derived properties
  const isMobile = isSmall // <= 768px
  const isTablet = !isSmall && !isAboveMedium // > 768px and <= 1024px
  const isDesktop = isAboveMedium // > 1024px

  // Utility function for custom queries
  const matchesQuery = (query: string) => {
    return window.matchMedia(query).matches
  }

  const value = useMemo(
    () => ({
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
    }),
    [
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
      isDesktop
    ]
  )

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
