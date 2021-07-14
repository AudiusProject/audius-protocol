import { createSelector } from '@reduxjs/toolkit'

import { AppState } from 'store/types'

const shareSoundToTikTokModalState = (state: AppState) =>
  state.application.ui.shareSoundToTikTokModal

export const getIsOpen = createSelector(
  shareSoundToTikTokModalState,
  state => state.isOpen
)
export const getTrack = createSelector(
  shareSoundToTikTokModalState,
  state => state.track
)
export const getIsAuthenticated = createSelector(
  shareSoundToTikTokModalState,
  state => state.isAuthenticated
)
export const getStatus = createSelector(
  shareSoundToTikTokModalState,
  state => state.status
)
