import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * NOTE: updated the route from the legacy url structure to hash routing.
 * ie. /services/service-providers => /#/services/service-providers
 *
 * NOTE: After switching to ipfs hosted, we can remove entirely
 */


// -------------------------------- Hooks  --------------------------------
export const useRerouteLegacy = () => {
  const location = useLocation()
  useEffect(() => {
    if (
      window.location.pathname !== '/' &&
      !window.location.pathname.includes('/ipns') &&
      !window.location.pathname.includes('/ipfs')
    ) {
      window.history.replaceState({}, '', `/#${window.location.pathname}`)
    }
  }, [location])
}

export default useRerouteLegacy
