import { ID } from 'common/models/Identifiers'
import { UserTip } from 'common/models/Tipping'
import { Nullable } from 'common/utils/typeUtils'
import { FEED_TIP_DISMISSAL_TIME_LIMIT } from 'utils/constants'

const RECENT_TIPS_KEY = 'recent-tips'

type RecentTipsStorage = {
  dismissed: boolean
  minSlot: number
  lastDismissalTimestamp: Nullable<number>
}

const getRecentTipsStorage = () => {
  if (!window.localStorage) {
    return null
  }

  const value = window.localStorage.getItem(RECENT_TIPS_KEY)
  if (!value) {
    return null
  }

  return JSON.parse(value) as RecentTipsStorage
}

export const getMinSlotForRecentTips = () => {
  const storage = getRecentTipsStorage()
  return storage ? storage.minSlot : null
}

export const getDismissedSlotForRecentTips = () => {
  const storage = getRecentTipsStorage()
  return storage ? storage.dismissed : null
}

const resetStorage = (minSlot: number) => {
  window.localStorage.setItem(
    RECENT_TIPS_KEY,
    JSON.stringify({
      minSlot,
      dismissed: false,
      lastDismissalTimestamp: null
    })
  )
}

export const checkTipToDisplay = ({
  userId,
  recentTips
}: {
  userId: ID
  recentTips: UserTip[]
}) => {
  if (recentTips.length === 0) {
    return null
  }

  /**
   * The list only comprises of recent tips.
   * Sort the tips by least recent to parse through oldest tips first.
   */
  const sortedTips = recentTips.sort((tip1, tip2) => tip1.slot - tip2.slot)

  /** Return oldest of the recent tips if no local storage */
  if (!window.localStorage) {
    return sortedTips[0]
  }

  const storage = getRecentTipsStorage()
  /**
   * Return oldest of the recent tips if nothing in local storage.
   * Also set local storage values.
   */
  if (!storage) {
    const oldestValidTip = sortedTips[0]
    const newStorage = {
      minSlot: oldestValidTip.slot,
      dismissed: false,
      lastDismissalTimestamp: null
    }
    window.localStorage.setItem(RECENT_TIPS_KEY, JSON.stringify(newStorage))
    return oldestValidTip
  }

  let validTips = sortedTips.filter(tip => tip.slot > storage.minSlot)
  let ownTip = validTips.find(tip => tip.sender_id === userId)
  if (ownTip) {
    resetStorage(ownTip.slot)
    return ownTip
  }

  let oldestValidTip = validTips.length > 0 ? validTips[0] : null
  if (oldestValidTip) {
    resetStorage(oldestValidTip.slot)
    return oldestValidTip
  }

  if (
    (storage.dismissed &&
      storage.lastDismissalTimestamp &&
      Date.now() - storage.lastDismissalTimestamp >
        FEED_TIP_DISMISSAL_TIME_LIMIT) ||
    !storage.dismissed
  ) {
    validTips = sortedTips.filter(tip => tip.slot === storage.minSlot)
    ownTip = validTips.find(tip => tip.sender_id === userId)
    if (ownTip) {
      resetStorage(ownTip.slot)
      return ownTip
    }

    oldestValidTip = validTips.length > 0 ? validTips[0] : null
    if (oldestValidTip) {
      resetStorage(oldestValidTip.slot)
      return oldestValidTip
    }

    /**
     * Should never reach here because that would mean that
     * there was previously a tip at some slot, and somehow later
     * there were no tips at an equal or more recent slot
     */
    return null
  }

  return null
}

export const dismissRecentTip = () => {
  if (!window.localStorage) {
    return
  }

  const storage = getRecentTipsStorage()
  if (!storage) {
    return
  }

  const newStorage = {
    minSlot: storage.minSlot,
    dismissed: true,
    lastDismissalTimestamp: Date.now()
  }
  window.localStorage.setItem(RECENT_TIPS_KEY, JSON.stringify(newStorage))
}
