import { createSelector } from 'reselect'

import { getCollection as getCachedCollection } from 'store/cache/collections/selectors'
import { getCollection as getSmartCollection } from 'containers/smart-collection/store/selectors'
import { getUser as getCachedUser } from 'store/cache/users/selectors'

export const getCollectionUid = state => state.collection.collectionUid
export const getCollectionId = state => state.collection.collectionId
export const getUserUid = state => state.collection.userUid
export const getCollectionStatus = state => state.collection.status
export const getSmartCollectionVariant = state =>
  state.collection.smartCollectionVariant

export const getCollection = state => {
  const smartCollectionVariant = getSmartCollectionVariant(state)
  if (smartCollectionVariant) {
    return getSmartCollection(state, { variant: smartCollectionVariant })
  }
  return getCachedCollection(state, { uid: getCollectionUid(state) })
}
export const getUser = state => getCachedUser(state, { uid: getUserUid(state) })

export const makeGetCollection = () =>
  createSelector(
    [getCollectionUid, getUserUid, getCollectionStatus, getCollection, getUser],
    (collectionUid, userUid, status, metadata, user) => {
      return {
        collectionUid,
        userUid,
        status,
        metadata,
        user
      }
    }
  )

export const getCollectionTracksLineup = state => state.collection.tracks
