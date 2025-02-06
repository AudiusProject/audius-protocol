import {
  createEntityAdapter,
  createSlice,
  PayloadAction
} from '@reduxjs/toolkit'

import { ID, Status } from '~/models'

import { RelatedArtists } from './types'

export const relatedArtistsAdapater = createEntityAdapter<RelatedArtists>({
  selectId: (relatedArtists) => relatedArtists.artistId
})

const relatedArtistsSlice = createSlice({
  name: 'relatedArtists',
  initialState: relatedArtistsAdapater.getInitialState(),
  reducers: {
    fetchRelatedArtists: (state, action: PayloadAction<{ artistId: ID }>) => {
      const { artistId } = action.payload
      relatedArtistsAdapater.addOne(state, {
        artistId,
        relatedArtistIds: [],
        suggestedFollowIds: [],
        isTopArtistsRecommendation: false,
        status: Status.LOADING
      })
    },
    fetchRelatedArtistsSucceeded: (
      state,
      action: PayloadAction<Omit<RelatedArtists, 'status'>>
    ) => {
      relatedArtistsAdapater.upsertOne(state, {
        ...action.payload,
        status: Status.SUCCESS
      })
    }
  }
})

export const { fetchRelatedArtists, fetchRelatedArtistsSucceeded } =
  relatedArtistsSlice.actions
export default relatedArtistsSlice.reducer
export const actions = relatedArtistsSlice.actions
