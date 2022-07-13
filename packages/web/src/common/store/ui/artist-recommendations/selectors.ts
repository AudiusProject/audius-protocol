import { ID } from 'common/models/Identifiers'
import { CommonState } from 'common/store'
import { getUsers } from 'common/store/cache/users/selectors'
import { createDeepEqualSelector } from 'common/utils/selectorHelpers'
import { removeNullable } from 'common/utils/typeUtils'

const getRelatedArtistIds = (state: CommonState, props: { id: ID }) =>
  state.ui.artistRecommendations[props.id]?.relatedArtistIds

export const makeGetRelatedArtists = () =>
  createDeepEqualSelector(
    [getRelatedArtistIds, getUsers],
    (relatedArtistIds, users) => {
      if (!relatedArtistIds) return []
      const relatedArtistsPopulated = relatedArtistIds
        .map((id) => {
          if (id in users) return users[id]
          return null
        })
        .filter(removeNullable)
      return relatedArtistsPopulated
    }
  )
