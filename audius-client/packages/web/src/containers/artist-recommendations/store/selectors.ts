import { createSelector } from '@reduxjs/toolkit'

import { ID } from 'common/models/Identifiers'
import { getUsers } from 'common/store/cache/users/selectors'
import { removeNullable } from 'common/utils/typeUtils'
import { AppState } from 'store/types'

const getRelatedArtistIds = (state: AppState, props: { id: ID }) =>
  state.application.ui.artistRecommendations[props.id]?.relatedArtistIds

export const makeGetRelatedArtists = () =>
  createSelector([getRelatedArtistIds, getUsers], (relatedArtistIds, users) => {
    if (!relatedArtistIds) return []
    const relatedArtistsPopulated = relatedArtistIds
      .map(id => {
        if (id in users) return users[id]
        return null
      })
      .filter(removeNullable)
    return relatedArtistsPopulated
  })
