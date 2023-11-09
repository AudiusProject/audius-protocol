import { useCallback, useEffect, useState } from 'react'

import { useGlobal } from 'hooks/useGlobal'

export const setOverflowHidden = () => {
  document.body.setAttribute('style', 'overflow:hidden;')
}

export const removeOverflowHidden = () => {
  document.body.setAttribute('style', '')
}

export const setModalRootTop = () => {
  const root = document.getElementById('modalRootContainer')
  if (root) {
    root.setAttribute('style', `top: ${window.scrollY}px`)
  }
}

export const useModalScrollCount = () => {
  const [getCount, setCount] = useGlobal('modal-scroll-count', 0)
  // Keep a state toggle to trigger recomputations of the effect
  const [toggle, setToggle] = useState(false)
  const [isOverflowHidden, setIsOverflowHidden] = useState(false)

  useEffect(() => {
    if (!isOverflowHidden && getCount() > 0) {
      setIsOverflowHidden(true)
      setOverflowHidden()
      setModalRootTop()
    } else if (isOverflowHidden && getCount() === 0) {
      setIsOverflowHidden(false)
      removeOverflowHidden()
    }
    return () => {
      /**
       * On cleanup of the `useScrollLock` hook, if the modal is open,
       * the count is decremented. Because the cleanup of this method
       * depends on the cleanup of `useScrollLock`, setImmediate is
       * used to push this check to the end of the event loop.
       * This guarantees that the getCount call will return
       * an updated number. Else, getCount() may non-deterministically
       * return 0 or 1 on cleanup of a final modal.
       * NOTE: This should only be triggered on un-mount when not closed
       */
      setImmediate(() => {
        if (isOverflowHidden && getCount() === 0) {
          removeOverflowHidden()
        }
      })
    }
  }, [getCount, isOverflowHidden, toggle])

  const incrementScrollCount = useCallback(() => {
    setCount((count) => count + 1)
    setToggle((toggle) => !toggle)
  }, [setCount, setToggle])
  const decrementScrollCount = useCallback(() => {
    // Though we should in theory never be decrementing past zero, getting into
    // that state would be bad for us, so guard against it defensively
    setCount((count) => Math.max(0, count - 1))
    setToggle((toggle) => !toggle)
  }, [setCount, setToggle])

  return {
    incrementScrollCount,
    decrementScrollCount
  }
}
