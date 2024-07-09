import { Mood } from '@audius/sdk'
import { isEmpty } from 'lodash'

import { createApi } from '~/audius-query'
import { ID } from '~/models/Identifiers'
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
  includePurchaseable?: boolean
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
      fetch: async (args: getSearchArgs, { apiClient, audiusBackend }) => {
        const { category, currentUserId, query, limit, offset, ...filters } =
          args

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

        if (query?.[0] === '#') {
          return await audiusBackend.searchTags({
            kind,
            query: query.toLowerCase().slice(1),
            limit: limit || 50,
            offset: offset || 0,
            ...filters,
            // @ts-ignore
            bpmMin,
            // @ts-ignore
            bpmMax,
            key: formatMusicalKey(filters.key)
          })
        } else {
          return await apiClient.getSearchFull({
            kind,
            currentUserId,
            query,
            limit,
            offset,
            ...filters,
            bpmMin,
            bpmMax,
            key: formatMusicalKey(filters.key)
          })
        }
      },
      options: {}
    }
  }
})

export const { useGetSearchResults } = searchApi.hooks
export const searchApiFetch = searchApi.fetch
export const searchApiReducer = searchApi.reducer
