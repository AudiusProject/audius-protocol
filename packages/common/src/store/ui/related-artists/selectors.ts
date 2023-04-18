import { ID, User } from 'models'
import { getUsers } from 'store/cache/users/selectors'
import { CommonState } from 'store/commonStore'
import { removeNullable, createDeepEqualSelector } from 'utils'

import { relatedArtistsAdapater } from './slice'

export const {
  selectById: selectRelatedArtistsById,
  selectIds: selectRelatedArtistsIds,
  selectEntities: selectRelatedArtistsEntities,
  selectAll: selectAllRelatedArtistss,
  selectTotal: selectTotalRelatedArtists
} = relatedArtistsAdapater.getSelectors<CommonState>(
  (state) => state.ui.relatedArtists
)

const selectRelatedArtistIds = (state: CommonState, props: { id: ID }) => {
  return selectRelatedArtistsById(state, props.id)?.relatedArtistIds
}

export const selectRelatedArtists = (state: CommonState, props: { id: ID }) => {
  return selectRelatedArtistsById(state, props.id)
}

const emptyRelatedArtists: User[] = []

export const selectRelatedArtistsUsers = createDeepEqualSelector(
  [selectRelatedArtistIds, getUsers],
  (relatedArtistIds, users) => {
    if (!relatedArtistIds) return emptyRelatedArtists
    const relatedArtistsPopulated = relatedArtistIds
      .map((id) => users[id])
      .filter(removeNullable)
    return relatedArtistsPopulated
  }
)
