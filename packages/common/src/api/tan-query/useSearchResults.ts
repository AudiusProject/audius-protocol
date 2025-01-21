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
  config?: QueryOptions
) => {
  const { audiusSdk, getFeatureEnabled, analytics } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const queryArgs = { category, limit, offset, sortMethod, ...filters }

  return useQuery({
    queryKey: [QUERY_KEYS.search, query, queryArgs],
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
        const entries: EntriesByKind = {}

        if (tracks?.length) {
          entries[Kind.TRACKS] = {}
          tracks.forEach((track) => {
            queryClient.setQueryData([QUERY_KEYS.track, track.track_id], track)
            entries[Kind.TRACKS]![track.track_id] = track
          })
        }

        if (users?.length) {
          entries[Kind.USERS] = {}
          users.forEach((user) => {
            queryClient.setQueryData([QUERY_KEYS.user, user.user_id], user)
            entries[Kind.USERS]![user.user_id] = user
          })
        }

        if (albums?.length) {
          entries[Kind.COLLECTIONS] = {}
          albums.forEach((album) => {
            queryClient.setQueryData(
              [QUERY_KEYS.collection, album.playlist_id],
              album
            )
            entries[Kind.COLLECTIONS]![album.playlist_id] = album
          })
        }

        if (playlists?.length) {
          if (!entries[Kind.COLLECTIONS]) entries[Kind.COLLECTIONS] = {}
          playlists.forEach((playlist) => {
            queryClient.setQueryData(
              [QUERY_KEYS.collection, playlist.playlist_id],
              playlist
            )
            entries[Kind.COLLECTIONS]![playlist.playlist_id] = playlist
          })
        }

        // Sync all data to Redux in a single dispatch
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
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false
  })
}
