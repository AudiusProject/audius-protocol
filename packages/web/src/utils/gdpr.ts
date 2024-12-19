import { Nullable } from '@audius/common/utils'

import { getLocation } from 'services/Location'
import { env } from 'services/env'
import { localStorage } from 'services/local-storage'

const DISMISSED_COOKIE_BANNER_KEY = 'dismissCookieBanner'
const IS_EU_KEY = 'isEU'
const IS_EU_CACHE_TTL_MS = 7 * 24 * 3600 * 1000

export const getIsInEU = async () => {
  const cachedIsEU: Nullable<boolean> =
    await localStorage.getExpiringJSONValue(IS_EU_KEY)

  if (cachedIsEU !== null) {
    return cachedIsEU
  }

  const location = await getLocation()
  if (!location) {
    return false
  }
  const isEU = location.is_eu
  localStorage.setExpiringJSONValue(IS_EU_KEY, isEU, IS_EU_CACHE_TTL_MS)
  return isEU
}

export const shouldShowCookieBanner = async (): Promise<boolean> => {
  if (env.ENVIRONMENT === 'production') {
    const isDimissed = await localStorage.getItem(DISMISSED_COOKIE_BANNER_KEY)
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
