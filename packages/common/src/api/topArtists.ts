import { createApi } from 'audius-query'
import { ID } from 'models/Identifiers'

import { userApiFetch } from './user'

type GetTopArtistsForGenreArgs = {
  genre: string
  limit?: number
  offset?: number
}

const topArtistsApi = createApi({
  reducerPath: 'topArtistsApi',
  endpoints: {
    getTopArtistsInGenre: {
      async fetch(args: GetTopArtistsForGenreArgs, context) {
        const { genre, limit, offset } = args
        const { apiClient } = context

        return await apiClient.getTopArtistGenres({
          genres: [genre],
          limit,
          offset
        })
      },
      options: { idArgKey: 'genre' }
    },
    getFeaturedArtists: {
      async fetch(_, context) {
        const { env, fetch } = context

        const response = await fetch(env.SUGGESTED_FOLLOW_HANDLES!)
        const featuredArtists: ID[] = await response.json()
        return await userApiFetch.getUsersByIds(
          { ids: featuredArtists },
          context
        )
      },
      options: {}
    }
  }
})

export const { useGetTopArtistsInGenre, useGetFeaturedArtists } =
  topArtistsApi.hooks

export const topArtistsApiReducer = topArtistsApi.reducer
