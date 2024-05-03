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
