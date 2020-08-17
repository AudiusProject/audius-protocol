export const INCREMENT_COUNT = 'SCROLL_COUNT/INCREMENT'
export const DECREMENT_COUNT = 'SCROLL_COUNT/DECREMENT'

export type ScrollLockActions = {
  type: typeof INCREMENT_COUNT | typeof DECREMENT_COUNT
}

export const incrementScrollCount = (): ScrollLockActions => ({
  type: INCREMENT_COUNT
})

export const decrementScrollCount = (): ScrollLockActions => ({
  type: DECREMENT_COUNT
})
