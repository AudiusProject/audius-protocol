import { uniq } from 'lodash'

import { userMetadataListFromSDK } from '~/adapters/user'
import { createApi } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'

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
        const { apiClient, audiusSdk, checkSDKMigration } = context
        const sdk = await audiusSdk()

        return await checkSDKMigration({
          legacy: apiClient.getTopArtistGenres({
            genres: [genre],
            limit,
            offset
          }),
          migrated: async () =>
            userMetadataListFromSDK(
              (
                await sdk.full.users.getTopUsersInGenre({
                  genre: [genre],
                  limit,
                  offset
                })
              ).data
            ),
          endpointName: 'getTopArtistsInGenre'
        })
      },
      options: { kind: Kind.USERS, schemaKey: 'users' }
    },
    getFeaturedArtists: {
      async fetch(_, context) {
        const { env, fetch } = context

        const response = await fetch(env.SUGGESTED_FOLLOW_HANDLES!)
        const featuredArtists: ID[] = await response.json()
        // dedupe the artists just in case the team accidentally adds the same artist twice
        const dedupedArtists = uniq(featuredArtists)

        return await userApiFetch.getUsersByIds(
          { ids: dedupedArtists },
          context
        )
      },
      options: { kind: Kind.USERS, schemaKey: 'users' }
    }
  }
})

export const { useGetTopArtistsInGenre, useGetFeaturedArtists } =
  topArtistsApi.hooks

export const topArtistsApiReducer = topArtistsApi.reducer
