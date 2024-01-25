import { memo, createContext, useCallback } from 'react'

import { useInstanceVar } from '@audius/common'
import { matchPath } from 'react-router-dom'

import { useIsMobile } from 'hooks/useIsMobile'
import { TRACK_PAGE, NOTIFICATION_PAGE } from 'utils/route'

type ScrollRecords = { [route: string]: number }

type ScrollContextProps = {
  setScrollForRoute: (route: string, scroll: number) => void
  getScrollForRoute: (route: string) => number
}

/**
 * `ScrollContext` provides a getter and setter for individual routes
 * to recover their last scroll position on mount and preserve it on unmount.
 */
export const ScrollContext = createContext<ScrollContextProps>({
  setScrollForRoute: (route: string, scroll: number) => {},
  getScrollForRoute: (route: string) => 0
})

// Routes where we know we never want to preserve scroll
const SCROLL_PRESERVATION_BLACKLIST = [TRACK_PAGE, NOTIFICATION_PAGE]

/**
 * `ScrollProvider` is a context provider that tracks
 * the last maintained scroll position for given route.
 */
export const ScrollProvider = memo((props: { children: JSX.Element }) => {
  const [getScrollRecords, setScrollRecords] = useInstanceVar<ScrollRecords>({})

  const setScrollForRoute = useCallback(
    (route: string, scroll: number) => {
      let inBlacklist = false
      SCROLL_PRESERVATION_BLACKLIST.forEach((path) => {
        const match = matchPath(route, { path })
        if (match) {
          inBlacklist = true
        }
      })
      if (inBlacklist) return
      setScrollRecords((s) => ({ ...s, [route]: scroll }))
    },
    [setScrollRecords]
  )

  const getScrollForRoute = useCallback(
    (route: string) => {
      return getScrollRecords()[route] || 0
    },
    [getScrollRecords]
  )

  if (useIsMobile()) {
    return (
      <ScrollContext.Provider
        value={{
          setScrollForRoute,
          getScrollForRoute
        }}
      >
        {props.children}
      </ScrollContext.Provider>
    )
  }

  return props.children
})
