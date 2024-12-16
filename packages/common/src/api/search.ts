import { Mood } from '@audius/sdk'
import { isEmpty } from 'lodash'

import { searchResultsFromSDK } from '~/adapters'
import { createApi } from '~/audius-query'
import { Name, SearchSource, UserTrackMetadata } from '~/models'
import { ID, OptionalId } from '~/models/Identifiers'
import { FeatureFlags } from '~/services'
import { SearchKind, SearchSortMethod } from '~/store'
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

type GetSearchArgs = {
  currentUserId: ID | null
  query: string
  category?: SearchCategory
  limit?: number
  offset?: number
  source?: SearchSource
  sortMethod?: SearchSortMethod
  disableAnalytics?: boolean
} & SearchFilters

const getMinMaxFromBpm = (bpm?: string) => {
  const bpmParts = bpm ? bpm.split('-') : [undefined, undefined]
  const bpmMin = bpmParts[0] ? parseFloat(bpmParts[0]) : undefined
  const bpmMax = bpmParts[1] ? parseFloat(bpmParts[1]) : bpmMin

  // Because we round the bpm display to the nearest whole number, we need to add a small buffer
  const bufferedBpmMin = bpmMin ? Math.round(bpmMin) - 0.5 : undefined
  const bufferedBpmMax = bpmMax ? Math.round(bpmMax) + 0.5 : undefined

  return [bufferedBpmMin, bufferedBpmMax]
}

const searchApi = createApi({
  reducerPath: 'searchApi',
  endpoints: {
    getSearchResults: {
      fetch: async (
        args: GetSearchArgs,
        { audiusSdk, getFeatureEnabled, analytics }
      ) => {
        const {
          category,
          currentUserId,
          query,
          limit,
          offset,
          source = 'search results page',
          disableAnalytics,
          ...filters
        } = args

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
        const sdk = await audiusSdk()

        const [bpmMin, bpmMax] = getMinMaxFromBpm(filters.bpm)

        const key = formatMusicalKey(filters.key)

        const isTagsSearch = query?.[0] === '#'

        const searchParams = {
          kind,
          userId: OptionalId.parse(currentUserId),
          query: isTagsSearch ? query.slice(1) : query,
          limit: limit || 50,
          offset: offset || 0,
          includePurchaseable: isUSDCEnabled,
          bpmMin,
          bpmMax,
          key: key ? [key] : undefined,
          genre: filters.genre ? [filters.genre] : undefined,
          mood: filters.mood ? [filters.mood] : undefined,
          sortMethod: filters.sortMethod,
          isVerified: filters.isVerified,
          hasDownloads: filters.hasDownloads,
          isPurchaseable: filters.isPremium
        }

        // Fire analytics only for the first page of results
        if (offset === 0 && !disableAnalytics) {
          analytics.track(
            analytics.make(
              isTagsSearch
                ? {
                    eventName: Name.SEARCH_TAG_SEARCH,
                    tag: query,
                    source,
                    ...searchParams
                  }
                : {
                    eventName: Name.SEARCH_SEARCH,
                    term: query,
                    source,
                    ...searchParams
                  }
            )
          )
        }

        const { data } = isTagsSearch
          ? await sdk.full.search.searchTags(searchParams)
          : await sdk.full.search.search(searchParams)
        const { tracks, playlists, albums, users } = searchResultsFromSDK(data)
        const results = { tracks, playlists, albums, users }

        const formattedResults = {
          ...results,
          tracks: results.tracks.map((track) => {
            return {
              ...track,
              user: {
                ...((track as UserTrackMetadata).user ?? {}),
                user_id: track.owner_id
              }
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
export const searchApiFetchSaga = searchApi.fetchSaga
export const searchApiReducer = searchApi.reducer
