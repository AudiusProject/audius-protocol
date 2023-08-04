import { ReactNode, useEffect, useMemo, useState } from 'react'

import { createPortal } from 'react-dom'

/**
 * Hook for better interaction with portals. Accepts an optional container element
 * to portal into. Otherwise, creates a portal into the document body.
 *
 * In your component...
 * ```
 *    const MyComponent = () => {
 *      const Portal = usePortal()
 *      return (
 *        <Portal>
 *          <div>some content</div>
 *        </Portal>
 *      )
 *    }
 * ```
 *
 * @param container
 */
export const usePortal = ({ container }: { container?: HTMLElement }) => {
  const [portalContainer, setPortalContainer] = useState<
    HTMLElement | undefined
  >(container)

  // Initialize the portal container if necessary
  useEffect(() => {
    if (!container) {
      const el = document.createElement('div')
      document.body.appendChild(el)
      setPortalContainer(el)
    } else {
      setPortalContainer(container)
    }
  }, [container, setPortalContainer])

  // Export the portal component memoized based on the portal container.
  // Users of Portal may wish to write their own effects with [Portal] in the dep array.
  const Portal = useMemo(
    () =>
      ({ children }: { children: ReactNode }) =>
        portalContainer ? createPortal(children, portalContainer!) : null,
    [portalContainer]
  )
  return Portal
}
