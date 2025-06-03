import { ID } from '~/models/Identifiers'
import { getUser as getCachedUser } from '~/store/cache/users/selectors'
import type { CommonState } from '~/store/commonStore'

export const getCollectionId = (state: CommonState) =>
  state.pages.collection.collectionId
export const getUserUid = (state: CommonState) => state.pages.collection.userUid
export const getCollectionStatus = (state: CommonState) =>
  state.pages.collection.status
export const getSmartCollectionVariant = (state: CommonState) =>
  state.pages.collection.smartCollectionVariant
export const getCollectionPermalink = (state: CommonState) =>
  state.pages.collection.collectionPermalink

export const getUser = (state: CommonState, params?: { id?: ID }) => {
  const props = params?.id ? { id: params.id } : { uid: getUserUid(state) }
  return getCachedUser(state, props)
}

export const getCollectionTracksLineup = (state: CommonState) =>
  state.pages.collection.tracks
