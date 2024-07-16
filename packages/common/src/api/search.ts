import { Mood } from '@audius/sdk'
import { isEmpty } from 'lodash'

import { createApi } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { FeatureFlags } from '~/services'
import { SearchKind } from '~/store'
import { Genre, formatMusicalKey } from '~/utils'

export type SearchCategory = 'all' | 'tracks' | 'albums' | 'playlists' | 'users'

export type SearchFilters = {
  genre?: Genre
  mood?: Mood
  bpm?: string
  key?: string
  isVerified?: boolean
  hasDownloads?: boolean
  isPremium?: boolean
}

export type SearchFilter = keyof SearchFilters

type getSearchArgs = {
  currentUserId: ID | null
  query: string
  category?: SearchCategory
  limit?: number
  offset?: number
} & SearchFilters

const getMinMaxFromBpm = (bpm?: string) => {
  const bpmParts = bpm ? bpm.split('-') : [undefined, undefined]
  const bpmMin = bpmParts[0] ? parseFloat(bpmParts[0]) : undefined
  const bpmMax = bpmParts[1] ? parseFloat(bpmParts[1]) : bpmMin
  return [bpmMin, bpmMax]
}

const searchApi = createApi({
  reducerPath: 'searchApi',
  endpoints: {
    getSearchResults: {
      fetch: async (
        args: getSearchArgs,
        { apiClient, audiusBackend, getFeatureEnabled }
      ) => {
        const { category, currentUserId, query, limit, offset, ...filters } =
          args

        const isUSDCEnabled = await getFeatureEnabled(
          FeatureFlags.USDC_PURCHASES
        )

        const kind = category as SearchKind
        if (!query && isEmpty(filters)) {
          return {
            tracks: [],
            users: [],
            albums: [],
            playlists: []
          }
        }

        const [bpmMin, bpmMax] = getMinMaxFromBpm(filters.bpm)

        const searchTags = async () => {
          return await audiusBackend.searchTags({
            userTagCount: 1,
            kind,
            query: query.toLowerCase().slice(1),
            limit: limit || 50,
            offset: offset || 0,
            ...filters,
            bpmMin,
            bpmMax,
            key: formatMusicalKey(filters.key)
          })
        }

        const search = async () => {
          return await apiClient.getSearchFull({
            kind,
            currentUserId,
            query,
            limit,
            offset,
            includePurchaseable: isUSDCEnabled,
            ...filters,
            bpmMin,
            bpmMax,
            key: formatMusicalKey(filters.key)
          })
        }

        const results = query?.[0] === '#' ? await searchTags() : await search()

        const formattedResults = {
          ...results,
          tracks: results.tracks.map((track) => {
            return {
              ...track,
              user: {
                ...track.user,
                user_id: track.owner_id
              },
              _cover_art_sizes: {}
            }
          })
        }

        return formattedResults
      },
      options: {}
    }
  }
})

export const { useGetSearchResults } = searchApi.hooks
export const searchApiFetch = searchApi.fetch
export const searchApiReducer = searchApi.reducer
