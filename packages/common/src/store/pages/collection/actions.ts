import { ID, SmartCollectionVariant, UID } from '../../../models'
import { Nullable } from '../../../utils'

export const FETCH_COLLECTION = 'FETCH_COLLECTION'
export const FETCH_COLLECTION_SUCCEEDED = 'FETCH_COLLECTION_SUCCEEDED'
export const FETCH_COLLECTION_FAILED = 'FETCH_COLLECTION_FAILED'
export const RESET_COLLECTION = 'RESET_COLLECTION'
export const SET_SMART_COLLECTION = 'SET_SMART_COLLECTION'

export const fetchCollection = (
  id: Nullable<number>,
  permalink?: string,
  fetchLineup?: boolean
) => ({
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
) => ({
  type: FETCH_COLLECTION_SUCCEEDED,
  collectionId,
  collectionUid,
  collectionPermalink,
  userUid
})

export const fetchCollectionFailed = (userUid: UID) => ({
  type: FETCH_COLLECTION_FAILED,
  userUid
})

export const resetCollection = (
  collectionUid?: Nullable<UID>,
  userUid?: Nullable<UID>
) => ({
  type: RESET_COLLECTION,
  collectionUid,
  userUid
})

export const setSmartCollection = (
  smartCollectionVariant: SmartCollectionVariant
) => ({
  type: SET_SMART_COLLECTION,
  smartCollectionVariant
})
