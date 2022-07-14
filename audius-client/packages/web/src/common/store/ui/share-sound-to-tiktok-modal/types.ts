import { ID } from '@audius/common'

export enum Status {
  SHARE_STARTED,
  SHARE_SUCCESS,
  SHARE_ERROR,
  SHARE_UNINITIALIZED
}

export type Track = {
  id: ID
  title: string
  duration: number
}

export type ShareSoundToTikTokModalState = {
  isAuthenticated: boolean
  track?: Track
  status: Status
  openId?: string
  accessToken?: string
}

export type AuthenticatedPayload = {
  openId?: string
  accessToken?: string
}

export type RequestOpenPayload = {
  id: ID
}

export type OpenPayload = {
  track: Track
}

export type SetStatusPayload = {
  status: Status
}
