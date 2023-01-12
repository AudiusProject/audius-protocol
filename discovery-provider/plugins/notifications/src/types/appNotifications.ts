export type FollowNotification = {
  follower_user_id: number
  followee_user_id: number
}

export type RepostNotification = {
  type: string
  user_id: number
  repost_item_id: number

}
export type SaveNotification = {
  type: string
  user_id: number
  save_item_id: number
}

export type MilestoneNotification = {
  type: string
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
  | FollowNotification
  | RepostNotification
  | SaveNotification
  | MilestoneNotification
  | RemixNotification
  | CosignRemixNotification
  | CreateTrackNotification
  | CreatePlaylistNotification
