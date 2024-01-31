import { ID } from '~/models/Identifiers'

import { CommonState } from '../commonStore'

import { PlaybackPositionInfo } from './types'

export const getPlaybackPositions = (state: CommonState) =>
  state.playbackPosition

export const getUserTrackPositions = (
  state: CommonState,
  props: { userId?: ID | null }
) => {
  const { userId } = props
  if (!userId) return null

  return state.playbackPosition[userId]?.trackPositions ?? null
}

export const getTrackPosition = (
  state: CommonState,
  props: { userId?: ID | null; trackId?: ID | null }
): PlaybackPositionInfo | null => {
  const { userId, trackId } = props
  if (!trackId || !userId) return null

  return state.playbackPosition[userId]?.trackPositions[trackId] ?? null
}
