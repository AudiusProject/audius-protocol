import { AggregatePlayRow, AggregateTrackRow, AggregateUserRow } from './db'

export type AggregatePlayBroadcast = {
  play_item_id: number
  old: AggregatePlayRow | undefined
  new: AggregatePlayRow
}

export type AggregateTrackBroadcast = {
  track_id: number
  old: AggregateTrackRow | undefined
  new: AggregateTrackRow
}

export type AggregateUserBroadcast = {
  user_id: number
  old: AggregateUserRow | undefined
  new: AggregateUserRow
}

export type TrackMilestone = {
  name: string
  value: number
  track_id: number
}

export type UserMilestone = {
  name: string
  value: number
  user_id: number
}
