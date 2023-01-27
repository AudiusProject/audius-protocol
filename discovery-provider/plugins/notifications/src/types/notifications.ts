import { EntityType } from "../email/appNotifications/types"

export type DMNotification = {
  sender_user_id: number
  receiver_user_id: number
  message: string
  timestamp: Date
}

export type DMReactionNotification = {
  sender_user_id: number
  receiver_user_id: number
  reaction: string
  message: string
  timestamp: Date
}

export type FollowNotification = {
  follower_user_id: number
  followee_user_id: number
}

export type RepostNotification = {
  type: EntityType
  user_id: number
  repost_item_id: number

}
export type SaveNotification = {
  type: EntityType
  user_id: number
  save_item_id: number
}

export type MilestoneNotification = {
  type: EntityType
  threshold: number
}

export type RemixNotification = {
  parent_track_id: number
  track_id: number
}

export type CosignRemixNotification = {
  parent_track_id: number
  track_id: number
}

export type CreateTrackNotification = {
  track_id: number
}

export type CreatePlaylistNotification = {
  is_album: boolean
  playlist_id: number
}

export type NotificationData =
  | DMNotification
  | DMReactionNotification
  | FollowNotification
  | RepostNotification
  | SaveNotification
  | MilestoneNotification
  | RemixNotification
  | CosignRemixNotification
  | CreateTrackNotification
  | CreatePlaylistNotification
