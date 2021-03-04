import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * NOTE: updated the route from the legacy url structure to hash routing.
 * ie. /services/service-providers => /#/services/service-providers
 *
 * NOTE: After switching to ipfs hosted, we can remove entirely
 */

const AUDIUS_URL = process.env.REACT_APP_AUDIUS_URL || ''

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
    } else if (
      window.location.protocol === 'http:' &&
      window.location.hostname !== 'localhost' &&
      AUDIUS_URL.includes('https:')
    ) {
      const updatedHref = window.location.href.replace('http:', 'https:')
      window.location.replace(updatedHref)
    }
  }, [location])
}

export default useRerouteLegacy
