import { createSelector } from '@reduxjs/toolkit'

import { CommonState } from 'common/store'

export const shareModalState = (state: CommonState) => state.ui.shareModal

export const getShareState = createSelector(shareModalState, (state) => {
  return state
})
