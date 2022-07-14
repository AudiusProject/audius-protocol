import { ID } from '@audius/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import Status from 'common/models/Status'

export type ArtistRecommendationsState = Record<
  ID,
  { relatedArtistIds: ID[]; status: Status }
>

const initialState: ArtistRecommendationsState = {}

const slice = createSlice({
  name: 'artist-recommendations',
  initialState,
  reducers: {
    fetchRelatedArtists: (state, action: PayloadAction<{ userId: ID }>) => {
      state[action.payload.userId] = {
        ...state[action.payload.userId],
        status: Status.LOADING
      }
    },
    fetchRelatedArtistsSucceeded: (
      state,
      action: PayloadAction<{ userId: ID; relatedArtistIds: ID[] }>
    ) => {
      if (!state[action.payload.userId].relatedArtistIds) {
        state[action.payload.userId] = {
          relatedArtistIds: action.payload.relatedArtistIds,
          status: Status.SUCCESS
        }
      }
    }
  }
})

export const { fetchRelatedArtists, fetchRelatedArtistsSucceeded } =
  slice.actions
export default slice.reducer
