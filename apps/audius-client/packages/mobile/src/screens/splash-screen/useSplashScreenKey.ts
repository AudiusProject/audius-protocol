import { useEffect, useState } from 'react'

export const useSplashScreenKey = () => {
  const [splashKey, setSplashKey] = useState(1)

  useEffect(() => {
    setSplashKey((k) => k + 1)
  }, [])

  return splashKey
}
