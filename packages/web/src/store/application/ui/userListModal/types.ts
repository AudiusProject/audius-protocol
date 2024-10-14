export enum UserListType {
  REPOST = 'REPOST',
  FAVORITE = 'FAVORITE',
  FOLLOWER = 'FOLLOWER',
  FOLLOWING = 'FOLLOWING',
  MUTUAL_FOLLOWER = 'MUTUAL_FOLLOWER',
  NOTIFICATION = 'NOTIFICATION',
  SUPPORTER = 'SUPPORTER',
  SUPPORTING = 'SUPPORTING',
  RELATED_ARTISTS = 'RELATED_ARTISTS',
  PURCHASER = 'PURCHASER',
  REMIXER = 'REMIXER'
}

export enum UserListEntityType {
  TRACK = 'TRACK',
  COLLECTION = 'COLLECTION',
  USER = 'USER'
}

export type UserListModalState = {
  userListType: UserListType
  isOpen: boolean
  entityType: UserListEntityType
}
