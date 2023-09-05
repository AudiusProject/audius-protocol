import { LocalStorage, RecentTipsStorage } from '@audius/common'

export const RECENT_TIPS_KEY = 'recent-tips'

export const getRecentTipsStorage = async (localStorage: LocalStorage) => {
  const value = (await localStorage.getItem(RECENT_TIPS_KEY)) ?? null
  return value ? (JSON.parse(value) as RecentTipsStorage) : null
}

export const updateTipsStorage = async (
  storage: RecentTipsStorage,
  localStorage: LocalStorage
) => {
  await localStorage.setItem(RECENT_TIPS_KEY, JSON.stringify(storage))
}

export const dismissRecentTip = async (localStorage: LocalStorage) => {
  const storage = await getRecentTipsStorage(localStorage)
  if (!storage) {
    return
  }

  updateTipsStorage(
    {
      minSlot: storage.minSlot,
      dismissed: true,
      lastDismissalTimestamp: Date.now()
    },
    localStorage
  )
}
