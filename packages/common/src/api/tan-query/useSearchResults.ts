import { Mood, OptionalId } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { isEmpty } from 'lodash'
import { useDispatch } from 'react-redux'

import { searchResultsFromSDK } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { Name, PlaybackSource, SearchSource, UserTrackMetadata } from '~/models'
import { ID } from '~/models/Identifiers'
import { FeatureFlags } from '~/services'
import { SearchKind, SearchSortMethod } from '~/store'
import { tracksActions as searchResultsPageTracksLineupActions } from '~/store/pages/search-results/lineup/tracks/actions'
import { getSearchTracksLineup } from '~/store/pages/search-results/selectors'
import { Genre, formatMusicalKey } from '~/utils'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { primeCollectionData } from './utils/primeCollectionData'
import { primeTrackData } from './utils/primeTrackData'
import { primeUserData } from './utils/primeUserData'
import { useLineupQuery } from './utils/useLineupQuery'

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
  pageSize?: number
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
  sortMethod,
  pageSize,
  ...filters
}: SearchArgs) => [
  QUERY_KEYS.search,
  query,
  { category, sortMethod, pageSize },
  { ...filters }
]

export const SEARCH_PAGE_SIZE = 10

export const useSearchResults = (
  {
    currentUserId,
    query,
    category,
    source = 'search results page',
    sortMethod,
    disableAnalytics,
    pageSize = SEARCH_PAGE_SIZE,
    ...filters
  }: SearchArgs,
  options?: QueryOptions
) => {
  const { audiusSdk, getFeatureEnabled, analytics } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const queryData = useInfiniteQuery({
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const prevPageByCategory = lastPage[category ?? '']
      const noMorePages =
        prevPageByCategory === undefined || // When using the All category we dont do any pagination
        prevPageByCategory.length < pageSize // When using a specific category we do pagination, so we just check that category
      return noMorePages ? undefined : pages.length * pageSize
    },
    queryKey: getSearchResultsQueryKey({
      currentUserId,
      query,
      category,
      sortMethod,
      ...filters
    }),
    queryFn: async ({ pageParam }) => {
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
        limit: pageSize,
        offset: pageParam,
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
      if (pageParam === 0 && !disableAnalytics) {
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

      // Prime cache data
      if (tracks?.length) {
        primeTrackData({ tracks, queryClient, dispatch })
      }

      if (users?.length) {
        primeUserData({ users, queryClient, dispatch })
      }

      if (albums?.length || playlists?.length) {
        primeCollectionData({
          collections: [...albums, ...playlists],
          queryClient,
          dispatch
        })
      }
      const formattedTracks = tracks.map((track) => ({
        ...track,
        user: {
          ...((track as UserTrackMetadata).user ?? {}),
          user_id: track.owner_id
        }
      }))

      // Track results need to also prep the lineup
      if (formattedTracks.length > 0) {
        dispatch(
          searchResultsPageTracksLineupActions.fetchLineupMetadatas(
            pageParam,
            pageSize,
            false,
            { tracks: formattedTracks }
          )
        )
      }
      return {
        tracks: formattedTracks,
        users,
        albums,
        playlists
      }
    },
    select: (data) => {
      return data?.pages?.reduce(
        (acc, page) => {
          return {
            tracks: [...acc?.tracks, ...page.tracks],
            users: [...acc?.users, ...page.users],
            albums: [...acc?.albums, ...page.albums],
            playlists: [...acc?.playlists, ...page.playlists]
          }
        },
        { tracks: [], users: [], albums: [], playlists: [] }
      )
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false
  })

  const lineupData = useLineupQuery({
    queryData,
    lineupActions: searchResultsPageTracksLineupActions,
    lineupSelector: getSearchTracksLineup,
    playbackSource: PlaybackSource.SEARCH_PAGE
  })

  return {
    ...queryData,
    ...lineupData
  }
}
