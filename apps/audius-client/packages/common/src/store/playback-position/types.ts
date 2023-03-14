import { ID } from 'models/Identifiers'

export const PLAYBACK_POSITION_LS_KEY = 'playbackPosition'

export type PlaybackStatus = 'IN_PROGRESS' | 'COMPLETED'

export type PlaybackPositionInfo = {
  status: PlaybackStatus
  playbackPosition: number
}

export type PlaybackPositionState = {
  trackPositions: { [Key in ID]?: PlaybackPositionInfo }
}
