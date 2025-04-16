import { ID, SmartCollectionVariant, UID } from '../../../models'

export const FETCH_COLLECTION_SUCCEEDED =
  'COLLECTION/FETCH_COLLECTION_SUCCEEDED'
export const FETCH_COLLECTION_FAILED = 'COLLECTION/FETCH_COLLECTION_FAILED'
export const RESET_COLLECTION = 'COLLECTION/RESET_COLLECTION'
export const SET_SMART_COLLECTION = 'COLLECTION/SET_SMART_COLLECTION'

export type FetchCollectionSucceededAction = {
  type: typeof FETCH_COLLECTION_SUCCEEDED
  collectionId: ID
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
  | FetchCollectionSucceededAction
  | FetchCollectionFailedAction
  | ResetCollectionAction
  | SetSmartCollectionAction

export const fetchCollectionSucceeded = (
  collectionId: ID
): FetchCollectionSucceededAction => ({
  type: FETCH_COLLECTION_SUCCEEDED,
  collectionId
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
