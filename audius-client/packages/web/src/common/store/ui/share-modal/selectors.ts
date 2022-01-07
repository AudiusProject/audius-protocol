import { createSelector } from '@reduxjs/toolkit'

import { CommonState } from 'common/store'

const shareModalState = (state: CommonState) => state.ui.shareModal

export const getTrack = createSelector(shareModalState, state => state.track)
export const getSource = createSelector(shareModalState, state => state.source)
