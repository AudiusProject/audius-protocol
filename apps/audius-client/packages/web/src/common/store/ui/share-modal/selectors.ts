import { createSelector } from '@reduxjs/toolkit'

import { ShareSource } from 'common/models/Analytics'
import { Track } from 'common/models/Track'
import { User } from 'common/models/User'
import { CommonState } from 'common/store'

const shareModalState = (state: CommonState) => state.ui.shareModal

export const getShareState = createSelector(shareModalState, state => {
  return state
})
export const getTrack = createSelector(shareModalState, state => {
  if (state.content?.type === 'track') return state.content.track
})
export const getArtist = createSelector(shareModalState, state => {
  if (state.content?.type === 'track') return state.content.artist
})

export const getSource = createSelector(shareModalState, state => state.source)
