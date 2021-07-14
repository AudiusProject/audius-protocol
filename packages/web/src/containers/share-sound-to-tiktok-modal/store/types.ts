import { CID, ID } from 'models/common/Identifiers'

export enum Status {
  SHARE_STARTED,
  SHARE_SUCCESS,
  SHARE_ERROR,
  SHARE_UNINITIALIZED
}

export type Track = {
  cid: CID
  id: ID
  title: string
  duration: number
}

export type ShareSoundToTikTokModalState = {
  isAuthenticated: boolean
  isOpen: boolean
  track?: Track
  status: Status
}

export type OpenPayload = {
  track: Track
}

export type SetStatusPayload = {
  status: Status
}

export type SharePayload = {
  cid: string
}
