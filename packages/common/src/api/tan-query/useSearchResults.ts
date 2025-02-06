import { Mood, OptionalId } from '@audius/sdk'
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient
} from '@tanstack/react-query'
import { isEmpty } from 'lodash'
import { useDispatch } from 'react-redux'

import { searchResultsFromSDK } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import {
  Name,
  PlaybackSource,
  SearchSource,
  UserMetadata,
  UserCollectionMetadata,
  UserTrackMetadata
} from '~/models'
import { FeatureFlags } from '~/services'
import { SearchKind, SearchSortMethod } from '~/store'
import { tracksActions as searchResultsPageTracksLineupActions } from '~/store/pages/search-results/lineup/tracks/actions'
import { getSearchTracksLineup } from '~/store/pages/search-results/selectors'
import { Genre, formatMusicalKey } from '~/utils'

import { useCurrentUserId } from '..'

import { QUERY_KEYS } from './queryKeys'
import { FlatUseInfiniteQueryResult, QueryOptions } from './types'
import { loadNextPage } from './utils/infiniteQueryLoadNextPage'
import { primeCollectionData } from './utils/primeCollectionData'
import { primeTrackData } from './utils/primeTrackData'
import { primeUserData } from './utils/primeUserData'
import { queryOptions } from './utils/queryOptions'
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
  query?: string
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
  query,
  category,
  sortMethod,
  pageSize,
  ...filters
}: Omit<SearchArgs & { category: SearchCategory }, 'currentUserId'>) => [
  QUERY_KEYS.search,
  category,
  query,
  { sortMethod, pageSize, ...filters }
]

export const SEARCH_PAGE_SIZE = 12

const useSearchQueryProps = (
  {
    query = '',
    category,
    source = 'search results page',
    sortMethod,
    disableAnalytics,
    pageSize = SEARCH_PAGE_SIZE,
    ...filters
  }: SearchArgs & { category: SearchCategory },
  options?: QueryOptions
) => {
  const { data: currentUserId } = useCurrentUserId()
  const queryKeyArgs = {
    query,
    category,
    sortMethod,
    pageSize,
    ...filters
  }
  const { audiusSdk, getFeatureEnabled, analytics } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return {
    initialPageParam: 0,
    queryKey: getSearchResultsQueryKey(queryKeyArgs),
    queryFn: async ({
      pageParam
      // unfortunately tanquery was having type issues with pageParam here
    }: any): Promise<{
      tracks: UserTrackMetadata[]
      users: UserMetadata[]
      albums: UserCollectionMetadata[]
      playlists: UserCollectionMetadata[]
    }> => {
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

      const primeSearchSlice = <
        T extends
          | UserTrackMetadata[]
          | UserMetadata[]
          | UserCollectionMetadata[]
      >(
        data: T,
        category: SearchCategory
      ) => {
        queryClient.setQueryData(
          getSearchResultsQueryKey({
            ...queryKeyArgs,
            category
          }),
          (queryData: InfiniteData<T[]>): InfiniteData<T[]> => {
            const prevPages = (queryData?.pages as unknown as T[]) ?? []
            const currentIndex = pageParam % pageSize
            prevPages[currentIndex] = data
            return {
              pages: prevPages as unknown as T[][],
              pageParams: [pageParam]
            }
          }
        )
      }

      // We only prime other caches when loading data into the all category
      // TODO: This is disabled for now because the search endpoint is returning data in different orders from the 'all' search vs a more specific one
      const shouldPrimeCache = false // category === 'all'

      // Prime entity cache data & the individual search slice data
      if (tracks?.length) {
        primeTrackData({ tracks, queryClient, dispatch })
        if (shouldPrimeCache) {
          primeSearchSlice(tracks, 'tracks')
        }
      }

      if (users?.length) {
        primeUserData({ users, queryClient, dispatch })
        if (shouldPrimeCache) {
          primeSearchSlice(users, 'users')
        }
      }

      if (albums?.length || playlists?.length) {
        primeCollectionData({
          collections: [...albums, ...playlists],
          queryClient,
          dispatch
        })
        if (albums?.length && shouldPrimeCache) {
          primeSearchSlice(albums, 'albums')
        }

        if (playlists?.length && shouldPrimeCache) {
          primeSearchSlice(playlists, 'playlists')
        }
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
    select: (data: InfiniteData<any[]>) => {
      return data?.pages?.flat()
    },
    enabled: options?.enabled !== false && currentUserId !== undefined,
    ...queryOptions(options)
  }
}

export const useSearchAllResults = (
  searchArgs: SearchArgs,
  options?: QueryOptions
) => {
  const { pageSize = SEARCH_PAGE_SIZE } = searchArgs
  const queryProps = useSearchQueryProps(
    {
      ...searchArgs,
      category: 'all'
    },
    options
  )

  const queryData = useInfiniteQuery({
    ...queryProps,
    getNextPageParam: (
      _lastPage: {
        tracks: UserTrackMetadata[]
        users: UserMetadata[]
        albums: UserCollectionMetadata[]
        playlists: UserCollectionMetadata[]
      },
      pages
    ) => {
      // With the ALL category we don't do any pagination.
      // If we did we would never know when we're "out of pages" so just keep returning the next offset indefinitely
      return pages.length * pageSize
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
    }
  })

  // The tracks need to be in a lineup
  const tracksLineupData = useLineupQuery({
    queryData,
    lineupActions: searchResultsPageTracksLineupActions,
    lineupSelector: getSearchTracksLineup,
    playbackSource: PlaybackSource.SEARCH_PAGE
  })

  return { ...queryData, ...tracksLineupData }
}

export const useSearchTrackResults = (
  searchArgs: SearchArgs,
  options?: QueryOptions
) => {
  const { pageSize = SEARCH_PAGE_SIZE } = searchArgs
  const queryProps = useSearchQueryProps(
    {
      ...searchArgs,
      category: 'tracks'
    },
    options
  )

  const queryData = useInfiniteQuery({
    ...queryProps,
    getNextPageParam: (
      lastPage: UserTrackMetadata[],
      pages: UserTrackMetadata[][]
    ) => {
      const noMorePages = lastPage.length < pageSize // When using a specific category we do pagination, so we just check that category
      return noMorePages ? undefined : pages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const data = await queryProps.queryFn({ pageParam })
      return data.tracks
    }
  })

  const lineupData = useLineupQuery({
    queryData,
    lineupActions: searchResultsPageTracksLineupActions,
    lineupSelector: getSearchTracksLineup,
    playbackSource: PlaybackSource.SEARCH_PAGE
  })

  return { ...queryData, ...lineupData }
}

export const useSearchUserResults = (
  searchArgs: SearchArgs,
  options?: QueryOptions
) => {
  const { pageSize = SEARCH_PAGE_SIZE } = searchArgs
  const queryProps = useSearchQueryProps(
    {
      ...searchArgs,
      category: 'users'
    },
    options
  )

  const queryData = useInfiniteQuery({
    ...queryProps,
    getNextPageParam: (lastPage: UserMetadata[], pages) => {
      const noMorePages = lastPage.length < pageSize
      return noMorePages ? undefined : pages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const data = await queryProps.queryFn({ pageParam })
      return data.users
    }
  }) as FlatUseInfiniteQueryResult<UserMetadata>

  return { ...queryData, loadNextPage: loadNextPage(queryData) }
}

export const useSearchAlbumResults = (
  searchArgs: SearchArgs,
  options?: QueryOptions
) => {
  const { pageSize = SEARCH_PAGE_SIZE } = searchArgs
  const queryProps = useSearchQueryProps(
    {
      ...searchArgs,
      category: 'albums'
    },
    options
  )

  const queryData = useInfiniteQuery({
    ...queryProps,
    getNextPageParam: (lastPage: UserCollectionMetadata[], pages) => {
      const noMorePages = lastPage.length < pageSize
      return noMorePages ? undefined : pages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const data = await queryProps.queryFn({ pageParam })
      return data.albums
    }
  }) as FlatUseInfiniteQueryResult<UserCollectionMetadata>

  return { ...queryData, loadNextPage: loadNextPage(queryData) }
}

export const useSearchPlaylistResults = (
  searchArgs: SearchArgs,
  options?: QueryOptions
) => {
  const { pageSize = SEARCH_PAGE_SIZE } = searchArgs
  const queryProps = useSearchQueryProps(
    {
      ...searchArgs,
      category: 'playlists'
    },
    options
  )

  const queryData = useInfiniteQuery({
    ...queryProps,
    getNextPageParam: (lastPage: UserCollectionMetadata[], pages) => {
      const noMorePages = lastPage.length < pageSize
      return noMorePages ? undefined : pages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const data = await queryProps.queryFn({ pageParam })
      return data.playlists
    }
  }) as FlatUseInfiniteQueryResult<UserCollectionMetadata>

  return { ...queryData, loadNextPage: loadNextPage(queryData) }
}
