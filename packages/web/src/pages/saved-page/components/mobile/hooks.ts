import { useCallback, useEffect, useRef, useState } from 'react'

import {
  CommonState,
  SavedPageTabs,
  savedPageSelectors
} from '@audius/common/store'
import { useSelector } from 'react-redux'

const { getCategory } = savedPageSelectors

const OFFSET_HEIGHT = 163
const SCROLL_HEIGHT = 88

/**
 * The Filter input should be hidden and displayed on scroll down.
 * The content container's height is set as the height plus the scroll
 * height so the search container can be hidden under the top bar.
 * On component mount, the child component is scrolled to hide the input.
 */
const useOffsetScroll = () => {
  // Set the child's height base on it's content vs window height
  const contentRefCallback = useCallback(
    (node: HTMLDivElement, shouldReset?: boolean) => {
      if (node !== null) {
        if (shouldReset) {
          // TS complains about setting height value to null, but null is actually a valid value for this and is used to unset the height value altogether.
          // @ts-expect-error
          node.style.height = null
          return
        }
        const contentHeight = (window as any).innerHeight - OFFSET_HEIGHT
        const useContentHeight = contentHeight > node.scrollHeight
        node.style.height = useContentHeight
          ? `calc(${contentHeight}px + ${SCROLL_HEIGHT}px)`
          : `${node.scrollHeight + SCROLL_HEIGHT}px`
      }
    },
    []
  )

  return contentRefCallback
}

export const useTabContainerRef = ({
  resultsLength,
  hasNoResults,
  currentTab,
  isFilterActive
}: {
  resultsLength: number | undefined
  hasNoResults: boolean
  currentTab: SavedPageTabs
  isFilterActive: boolean
}) => {
  const [hasCompletedInitialLoad, setHasCompletedInitialLoad] = useState(false)

  const selectedCategory = useSelector((state: CommonState) =>
    getCategory(state, {
      currentTab
    })
  )
  const containerRef = useRef(null)
  const contentRefCallback = useOffsetScroll()

  useEffect(() => {
    // Scroll down past the filter input once the initial load is complete. If we don't do this, the scroll position won't end up in the right place.
    if (!hasCompletedInitialLoad && resultsLength && !isFilterActive) {
      window.scroll(0, SCROLL_HEIGHT)
      return
    }
    if (resultsLength === undefined && !isFilterActive) {
      setHasCompletedInitialLoad(false)
    }
    // Disable exhaustive deps since the exclusions are deliberate - see above comment
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultsLength, hasNoResults])

  useEffect(() => {
    // When the length of the results list changes, or we switch from loading state to empty state or list state (and vice versa), recalculate the height of the container.
    if (containerRef.current) {
      contentRefCallback(containerRef.current)
    }
    // Disable exhaustive deps since the exclusions are deliberate - see above comment
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultsLength, hasNoResults])

  useEffect(() => {
    // When the selected category (favorites/reposts/purchased/all) changes, recalculate the height of the container and scroll to the top.
    if (containerRef.current) {
      contentRefCallback(containerRef.current, true)
      window.scroll(0, SCROLL_HEIGHT)
    }
    // Disable exhaustive deps since the exclusions are deliberate - see above comment
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory])

  return containerRef
}
