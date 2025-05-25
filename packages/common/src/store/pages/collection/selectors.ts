import { ID } from '~/models/Identifiers'
import { getCollection as getCachedCollection } from '~/store/cache/collections/selectors'
import { getUser as getCachedUser } from '~/store/cache/users/selectors'
import type { CommonState } from '~/store/commonStore'
import { getCollection as getSmartCollection } from '~/store/pages/smart-collection/selectors'
import { Nullable } from '~/utils/typeUtils'

export const getCollectionId = (state: CommonState) =>
  state.pages.collection.collectionId
export const getUserUid = (state: CommonState) => state.pages.collection.userUid
export const getCollectionStatus = (state: CommonState) =>
  state.pages.collection.status
export const getSmartCollectionVariant = (state: CommonState) =>
  state.pages.collection.smartCollectionVariant
export const getCollectionPermalink = (state: CommonState) =>
  state.pages.collection.collectionPermalink
export const getCollection = (
  state: CommonState,
  params?: { id?: Nullable<ID> }
) => {
  const smartCollectionVariant = getSmartCollectionVariant(state)
  if (smartCollectionVariant) {
    return getSmartCollection(state, { variant: smartCollectionVariant })
  }

  if (params?.id) {
    return getCachedCollection(state, params)
  }

  const permalink = getCollectionPermalink(state)
  const config = permalink ? { permalink } : { id: getCollectionId(state) }

  return getCachedCollection(state, config)
}

export const getUser = (state: CommonState, params?: { id?: ID }) => {
  const props = params?.id ? { id: params.id } : { uid: getUserUid(state) }
  return getCachedUser(state, props)
}

export const getCollectionTracksLineup = (state: CommonState) =>
  state.pages.collection.tracks
