import { Mood, OptionalId } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isEmpty } from 'lodash'
import { useDispatch } from 'react-redux'

import { searchResultsFromSDK } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { Name, SearchSource, UserTrackMetadata } from '~/models'
import { ID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { FeatureFlags } from '~/services'
import { SearchKind, SearchSortMethod } from '~/store'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'
import { Genre, formatMusicalKey } from '~/utils'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { batchSetQueriesEntries } from './utils/batchSetQueriesEntries'

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

export type SearchArgs = {
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

export const getSearchResultsQueryKey = ({
  currentUserId,
  query,
  category,
  limit,
  offset,
  source,
  sortMethod,
  disableAnalytics,
  ...filters
}: SearchArgs) => [
  QUERY_KEYS.search,
  query,
  { category, limit, offset, source, sortMethod, disableAnalytics },
  { ...filters }
]

export const useSearchResults = (
  {
    currentUserId,
    query,
    category,
    limit,
    offset,
    source = 'search results page',
    sortMethod,
    disableAnalytics,
    ...filters
  }: SearchArgs,
  options?: QueryOptions
) => {
  const { audiusSdk, getFeatureEnabled, analytics } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: getSearchResultsQueryKey({
      currentUserId,
      query,
      category,
      limit,
      offset,
      sortMethod,
      ...filters
    }),
    queryFn: async () => {
      const isUSDCEnabled = await getFeatureEnabled(FeatureFlags.USDC_PURCHASES)

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
        sortMethod,
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

      // Cross pollinate our entity cache with all the loaded entities from our search data
      if (
        tracks?.length ||
        users?.length ||
        albums?.length ||
        playlists?.length
      ) {
        const entries: EntriesByKind = {
          [Kind.TRACKS]: Object.fromEntries(
            tracks?.map((track) => [track.track_id, track]) ?? []
          ),
          [Kind.USERS]: Object.fromEntries(
            users?.map((user) => [user.user_id, user]) ?? []
          ),
          [Kind.COLLECTIONS]: Object.fromEntries([
            ...(albums?.map((album) => [album.playlist_id, album]) ?? []),
            ...(playlists?.map((playlist) => [
              playlist.playlist_id,
              playlist
            ]) ?? [])
          ])
        }

        // Sync all data to Redux in a single dispatch
        batchSetQueriesEntries({ entries, queryClient })
        dispatch(addEntries(entries, undefined, undefined, 'react-query'))
      }
      const formattedTracks = tracks.map((track) => ({
        ...track,
        user: {
          ...((track as UserTrackMetadata).user ?? {}),
          user_id: track.owner_id
        }
      }))
      return {
        tracks: formattedTracks,
        users,
        albums,
        playlists
      }
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false
  })
}
