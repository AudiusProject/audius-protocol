import { ID } from '../../../models/Identifiers'

export enum ShareSoundToTiktokModalStatus {
  SHARE_STARTED,
  SHARE_SUCCESS,
  SHARE_ERROR,
  SHARE_UNINITIALIZED
}

export type ShareSoundToTiktokModalTrack = {
  id: ID
  title: string
  duration: number
}

export type ShareSoundToTikTokModalState = {
  isAuthenticated: boolean
  track?: ShareSoundToTiktokModalTrack
  status: ShareSoundToTiktokModalStatus
  openId?: string
  accessToken?: string
}

export type ShareSoundToTiktokModalAuthenticatedPayload = {
  openId?: string
  accessToken?: string
}

export type ShareSoundToTiktokModalRequestOpenPayload = {
  id: ID
}

export type ShareSoundToTiktokModalOpenPayload = {
  track: ShareSoundToTiktokModalTrack
}

export type ShareSoundToTiktokModalSetStatusPayload = {
  status: ShareSoundToTiktokModalStatus
}
