import { ID, SmartCollectionVariant, UID } from '../../../models'

export const FETCH_COLLECTION = 'FETCH_COLLECTION'
export const FETCH_COLLECTION_SUCCEEDED = 'FETCH_COLLECTION_SUCCEEDED'
export const FETCH_COLLECTION_FAILED = 'FETCH_COLLECTION_FAILED'
export const RESET_COLLECTION = 'RESET_COLLECTION'
export const SET_SMART_COLLECTION = 'SET_SMART_COLLECTION'

export type FetchCollectionAction = {
  type: typeof FETCH_COLLECTION
  id: ID | null
  permalink?: string
  fetchLineup?: boolean
}

export type FetchCollectionSucceededAction = {
  type: typeof FETCH_COLLECTION_SUCCEEDED
  collectionId: ID
  collectionUid: string
  collectionPermalink: string
  userUid: string
}

export type FetchCollectionFailedAction = {
  type: typeof FETCH_COLLECTION_FAILED
  userUid: UID
}

export type ResetCollectionAction = {
  type: typeof RESET_COLLECTION
  collectionUid?: UID | null
  userUid?: UID | null
}

export type SetSmartCollectionAction = {
  type: typeof SET_SMART_COLLECTION
  smartCollectionVariant: SmartCollectionVariant
}

export type CollectionPageAction =
  | FetchCollectionAction
  | FetchCollectionSucceededAction
  | FetchCollectionFailedAction
  | ResetCollectionAction
  | SetSmartCollectionAction

export const fetchCollection = (
  id: number | null,
  permalink?: string,
  fetchLineup?: boolean
): FetchCollectionAction => ({
  type: FETCH_COLLECTION,
  id,
  permalink,
  fetchLineup
})

export const fetchCollectionSucceeded = (
  collectionId: ID,
  collectionUid: string,
  collectionPermalink: string,
  userUid: string
): FetchCollectionSucceededAction => ({
  type: FETCH_COLLECTION_SUCCEEDED,
  collectionId,
  collectionUid,
  collectionPermalink,
  userUid
})

export const fetchCollectionFailed = (
  userUid: UID
): FetchCollectionFailedAction => ({
  type: FETCH_COLLECTION_FAILED,
  userUid
})

export const resetCollection = (
  collectionUid?: UID | null,
  userUid?: UID | null
): ResetCollectionAction => ({
  type: RESET_COLLECTION,
  collectionUid,
  userUid
})

export const setSmartCollection = (
  smartCollectionVariant: SmartCollectionVariant
): SetSmartCollectionAction => ({
  type: SET_SMART_COLLECTION,
  smartCollectionVariant
})
