import { RecentTipsStorage } from '@audius/common'

import { RECENT_TIPS_KEY } from 'utils/constants'

export const getRecentTipsStorage = () => {
  const value = window.localStorage?.getItem(RECENT_TIPS_KEY) ?? null
  return value ? (JSON.parse(value) as RecentTipsStorage) : null
}

export const updateTipsStorage = (storage: RecentTipsStorage) => {
  window.localStorage?.setItem(RECENT_TIPS_KEY, JSON.stringify(storage))
}

export const dismissRecentTip = () => {
  const storage = getRecentTipsStorage()
  if (!storage) {
    return
  }

  updateTipsStorage({
    minSlot: storage.minSlot,
    dismissed: true,
    lastDismissalTimestamp: Date.now()
  })
}
