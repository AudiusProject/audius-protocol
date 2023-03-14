import { ID } from 'models/Identifiers'

import { CommonState } from '../commonStore'

import { PlaybackPositionInfo } from './types'

export const getPlaybackPositions = (state: CommonState) =>
  state.playbackPosition

export const getTrackPositions = (state: CommonState) =>
  state.playbackPosition.trackPositions

export const getTrackPosition = (
  state: CommonState,
  props: { trackId?: ID | null }
): PlaybackPositionInfo | null => {
  const { trackId } = props
  if (!trackId) return null

  return state.playbackPosition.trackPositions[trackId] ?? null
}
