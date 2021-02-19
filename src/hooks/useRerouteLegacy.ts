import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * NOTE: updated the route from the legacy url structure to hash routing.
 * ie. /services/service-providers => /#/services/service-providers
 *
 * NOTE: When switching to being served from ipfs, this needs to be updated for the
 * client to be loaded via ipns
 */

// -------------------------------- Hooks  --------------------------------
export const useRerouteLegacy = () => {
  const location = useLocation()
  useEffect(() => {
    if (window.location.pathname !== '/') {
      window.history.replaceState({}, '', `/#${window.location.pathname}`)
    }
  }, [location])
}

export default useRerouteLegacy
