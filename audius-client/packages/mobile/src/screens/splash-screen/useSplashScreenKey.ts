import { useEffect, useState } from 'react'

import { useSelector } from 'react-redux'

import { getDappLoaded } from 'app/store/lifecycle/selectors'

export const useSplashScreenKey = () => {
  const dappLoaded = useSelector(getDappLoaded)
  const [splashKey, setSplashKey] = useState(1)

  useEffect(() => {
    if (!dappLoaded) {
      setSplashKey((k) => k + 1)
    }
  }, [dappLoaded])

  return splashKey
}
