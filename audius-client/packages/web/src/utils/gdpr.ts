import { getLocation } from 'services/Location'

const DISMISSED_COOKIE_BANNER_KEY = 'dismissCookieBanner'

export const getIsInEU = async () => {
  const location = await getLocation()
  if (!location) return false
  return location.in_eu
}

export const shouldShowCookieBanner = async (): Promise<boolean> => {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.REACT_APP_ENVIRONMENT === 'production'
  ) {
    const isDimissed = localStorage.getItem(DISMISSED_COOKIE_BANNER_KEY)
    if (isDimissed) return false
    const isInEU = await getIsInEU()
    return isInEU
  }
  return false
}

export const dismissCookieBanner = () => {
  const date = new Date().toString()
  localStorage.setItem(DISMISSED_COOKIE_BANNER_KEY, date)
}
