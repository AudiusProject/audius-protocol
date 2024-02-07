import { ID } from '~/models/Identifiers'

export const LEGACY_PLAYBACK_POSITION_LS_KEY = 'playbackPosition'
export const PLAYBACK_POSITION_LS_KEY = 'userPlaybackPositions'

export type PlaybackStatus = 'IN_PROGRESS' | 'COMPLETED'

export type PlaybackPositionInfo = {
  status: PlaybackStatus
  playbackPosition: number
}

export type PlaybackPositionState = {
  [UserIdKey in ID]?: {
    trackPositions: { [TrackIdKey in ID]?: PlaybackPositionInfo }
  }
}
