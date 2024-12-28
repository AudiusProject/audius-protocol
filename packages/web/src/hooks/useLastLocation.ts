import { useEffect, useRef } from 'react'

import { useLocation, Location } from 'react-router-dom'

const useLastLocation = () => {
  const location = useLocation()
  const lastLocationRef = useRef<Location | null>(null)

  useEffect(() => {
    lastLocationRef.current = location
  }, [location])

  return lastLocationRef.current
}

export default useLastLocation
