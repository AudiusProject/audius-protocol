import { AppState } from 'store/types'

export const getScrollLockCount = (state: AppState): number =>
  state.application.ui.scrollLock.lockCount
