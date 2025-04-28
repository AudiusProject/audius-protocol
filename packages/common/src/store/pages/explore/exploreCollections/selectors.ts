import { getCollections as getCachedCollections } from '~/store/cache/collections/selectors'
import { getUsers } from '~/store/cache/users/selectors'
import { CommonState } from '~/store/commonStore'

import { Status } from '../../../../models'
import { ExploreCollectionsVariant } from '../types'

const getBaseState = (state: CommonState) => state.pages.exploreCollections

export const getStatus = (
  state: CommonState,
  { variant }: { variant: ExploreCollectionsVariant }
) => {
  const baseState = getBaseState(state)[variant]
  return baseState ? baseState.status : Status.LOADING
}

export const getCollectionIds = (
  state: CommonState,
  { variant }: { variant: ExploreCollectionsVariant }
) => getBaseState(state)[variant]?.collectionIds ?? []

export const getCollections = (
  state: CommonState,
  { variant }: { variant: ExploreCollectionsVariant }
) => {
  const baseState = getBaseState(state)[variant]
  const collectionIds = baseState ? baseState.collectionIds : []
  const collections = getCachedCollections(state, { ids: collectionIds })

  const collectionsList = collectionIds.map((id) => collections[id]?.metadata)

  const userIds = collectionsList.map((c) => c.playlist_owner_id)
  const users = getUsers(state, { ids: userIds })

  const userCollections = collectionsList.map((c) => ({
    ...c,
    user: users[c.playlist_owner_id].metadata
  }))

  return userCollections.filter((playlist) => !playlist.user.is_deactivated)
}
