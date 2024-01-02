import type { TransactionReceipt } from 'web3-core'

import type { AuthService } from '../Auth'
import type { DiscoveryNodeSelectorService } from '../DiscoveryNodeSelector'
import type { LoggerService } from '../Logger'

export type EntityManagerConfigInternal = {
  /**
   * Address of the EntityManager contract
   */
  contractAddress: string
  /**
   * The URL of the Web3 provider service
   */
  web3ProviderUrl: string
  /**
   * The URL of the Audius Identity Service, used for relays
   */
  identityServiceUrl: string
  /**
   * Whether to use discovery for relay instead of identity
   */
  useDiscoveryRelay: boolean
  /**
   * Logger service, defaults to console
   */
  logger: LoggerService
}
export type EntityManagerConfig = Partial<EntityManagerConfigInternal> & {
  /**
   * The DiscoveryNodeSelector service used to get a discovery node to confirm blocks
   */
  discoveryNodeSelector: DiscoveryNodeSelectorService
}

export type EntityManagerService = {
  manageEntity: (
    options: ManageEntityOptions
  ) => Promise<Pick<TransactionReceipt, 'blockHash' | 'blockNumber'>>
  confirmWrite: (options: {
    blockHash: string
    blockNumber: number
    confirmationTimeout?: number
    confirmationPollingInterval?: number
  }) => Promise<boolean>
  getCurrentBlock: () => Promise<{ timestamp: number }>
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
  GRANT = 'Grant',
  DASHBOARD_WALLET_USER = 'DashboardWalletUser'
}

export type AdvancedOptions = {
  /**
   * Timeout confirmation of the write
   */
  confirmationTimeout?: number
  /**
   * Skip confirmation of the write
   */
  skipConfirmation?: boolean
}

export type ManageEntityOptions = {
  /**
   * The numeric user id
   */
  userId: number
  /**
   * The type of entity being modified
   */
  entityType: EntityType
  /**
   * The id of the entity
   */
  entityId: number
  /**
   * Action being performed on the entity
   */
  action: Action
  /**
   * Metadata associated with the action
   */
  metadata?: string
  /**
   * An instance of AuthService
   */
  auth: AuthService
} & AdvancedOptions

export enum BlockConfirmation {
  CONFIRMED = 'CONFIRMED',
  DENIED = 'DENIED',
  UNKNOWN = 'UNKNOWN'
}
