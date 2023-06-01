import type { AuthService } from '../Auth'
import type { TransactionReceipt } from 'web3-core'

export type EntityManagerConfig = {
  contractAddress: string
  web3ProviderUrl: string
  identityServiceUrl: string
}

export enum Action {
  CREATE = 'Create',
  UPDATE = 'Update',
  DELETE = 'Delete',
  VERIFY = 'Verify',
  FOLLOW = 'Follow',
  UNFOLLOW = 'Unfollow',
  SAVE = 'Save',
  UNSAVE = 'Unsave',
  REPOST = 'Repost',
  UNREPOST = 'Unrepost',
  SUBSCRIBE = 'Subscribe',
  UNSUBSCRIBE = 'Unsubscribe',
  VIEW = 'View',
  VIEW_PLAYLIST = 'ViewPlaylist'
}

export enum EntityType {
  PLAYLIST = 'Playlist',
  TRACK = 'Track',
  USER = 'User',
  USER_REPLICA_SET = 'UserReplicaSet',
  NOTIFICATION = 'Notification',
  DEVELOPER_APP = 'DeveloperApp',
  GRANT = 'Grant'
}

export type EntityManagerService = {
  manageEntity: (options: {
    userId: number
    entityType: EntityType
    entityId: number
    action: Action
    metadata: string
    auth: AuthService
  }) => Promise<{ txReceipt: TransactionReceipt }>
}
