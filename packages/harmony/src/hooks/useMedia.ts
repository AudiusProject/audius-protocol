/**
 * A hook that provides responsive design state based on predefined breakpoints.
 *
 * This is now a re-export from MediaContext, which centralizes all media query listeners
 * in a single provider to improve performance.
 *
 * @example
 * ```tsx
 * const { isMobile, isTablet, isDesktop, matchesQuery } = useMedia()
 *
 * // Conditionally render based on screen size
 * if (isMobile) return <MobileView />
 * if (isTablet) return <TabletView />
 * if (matchesQuery(breakpoints.between.lg_xl)) return <LargeDesktopView />
 * return <DefaultView />
 * ```
 */
export { useMedia } from '../contexts/MediaContext'
