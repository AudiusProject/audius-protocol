import { createSelector } from 'reselect'

import { UID } from 'common/models/Identifiers'
import Status from 'common/models/Status'
import { getCollection as getCachedCollection } from 'common/store/cache/collections/selectors'
import { getUser as getCachedUser } from 'common/store/cache/users/selectors'
import { getCollection as getSmartCollection } from 'containers/smart-collection/store/selectors'
import { AppState } from 'store/types'

export const getCollectionUid = (state: AppState) =>
  state.collection.collectionUid
export const getCollectionId = (state: AppState) =>
  state.collection.collectionId
export const getUserUid = (state: AppState) => state.collection.userUid
export const getCollectionStatus = (state: AppState) => state.collection.status
export const getSmartCollectionVariant = (state: AppState) =>
  state.collection.smartCollectionVariant

export const getCollection = (state: AppState) => {
  const smartCollectionVariant = getSmartCollectionVariant(state)
  if (smartCollectionVariant) {
    return getSmartCollection(state, { variant: smartCollectionVariant })
  }
  return getCachedCollection(state, { uid: getCollectionUid(state) })
}
export const getUser = (state: AppState) =>
  getCachedUser(state, { uid: getUserUid(state) })

export const makeGetCollection = () =>
  createSelector(
    [getCollectionUid, getUserUid, getCollectionStatus, getCollection, getUser],
    (collectionUid, userUid, status, metadata, user) => {
      return {
        collectionUid: collectionUid as UID,
        userUid: userUid as UID,
        status: status as Status,
        metadata,
        user
      }
    }
  )

export const getCollectionTracksLineup = (state: AppState) =>
  state.collection.tracks
