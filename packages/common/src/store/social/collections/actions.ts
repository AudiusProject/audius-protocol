import { createCustomAction } from 'typesafe-actions'

import {
  RepostSource,
  FavoriteSource,
  ShareSource
} from '../../../models/Analytics'
import { ID } from '../../../models/Identifiers'

export const REPOST_COLLECTION = 'SOCIAL/REPOST_COLLECTION'
export const UNDO_REPOST_COLLECTION = 'SOCIAL/UNDO_REPOST_COLLECTION'
export const REPOST_COLLECTION_FAILED = 'SOCIAL/REPOST_COLLECTION_FAILED'

export const SAVE_COLLECTION = 'SOCIAL/SAVE_COLLECTION'
export const SAVE_COLLECTION_SUCCEEDED = 'SOCIAL/SAVE_COLLECTION_SUCCEEDED'
export const SAVE_COLLECTION_FAILED = 'SOCIAL/SAVE_COLLECTION_FAILED'

export const UNSAVE_COLLECTION = 'SOCIAL/UNSAVE_COLLECTION'
export const UNSAVE_COLLECTION_SUCCEEDED = 'SOCIAL/UNSAVE_COLLECTION_SUCCEEDED'
export const UNSAVE_COLLECTION_FAILED = 'SOCIAL/UNSAVE_COLLECTION_FAILED'

export const SHARE_COLLECTION = 'SOCIAL/SHARE_COLLECTION'

export const repostCollection = createCustomAction(
  REPOST_COLLECTION,
  (collectionId: ID, source: RepostSource, isFeed = false, metadata?: any) => ({
    collectionId,
    metadata,
    source,
    isFeed
  })
)

export const undoRepostCollection = createCustomAction(
  UNDO_REPOST_COLLECTION,
  (collectionId: ID, source: RepostSource, metadata?: any) => ({
    collectionId,
    metadata,
    source
  })
)

export const repostCollectionFailed = createCustomAction(
  REPOST_COLLECTION_FAILED,
  (collectionId: ID, error: any) => ({ collectionId, error })
)

export const saveCollection = createCustomAction(
  SAVE_COLLECTION,
  (collectionId: ID, source: FavoriteSource, isFeed = false) => ({
    collectionId,
    source,
    isFeed
  })
)

export const saveCollectionSucceeded = createCustomAction(
  SAVE_COLLECTION_SUCCEEDED,
  (collectionId: ID) => ({ collectionId })
)

export const saveCollectionFailed = createCustomAction(
  SAVE_COLLECTION_FAILED,
  (collectionId: ID, error: any) => ({ collectionId, error })
)

export const unsaveCollection = createCustomAction(
  UNSAVE_COLLECTION,
  (collectionId: ID, source: FavoriteSource) => ({ collectionId, source })
)

export const unsaveCollectionSucceeded = createCustomAction(
  UNSAVE_COLLECTION_SUCCEEDED,
  (collectionId: ID) => ({ collectionId })
)

export const unsaveCollectionFailed = createCustomAction(
  UNSAVE_COLLECTION_FAILED,
  (collectionId: ID, error: any) => ({ collectionId, error })
)

export const shareCollection = createCustomAction(
  SHARE_COLLECTION,
  (collectionId: ID, source: ShareSource) => ({ collectionId, source })
)
