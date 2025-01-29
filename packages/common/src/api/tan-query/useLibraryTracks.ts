import { Id } from '@audius/sdk'
import {
  GetUserLibraryTracksSortMethodEnum,
  GetUserLibraryTracksSortDirectionEnum
} from '@audius/sdk/src/sdk/api/generated/full/apis/UsersApi'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { PlaybackSource } from '~/models/Analytics'
import { ID } from '~/models/Identifiers'
import {
  savedPageTracksLineupActions,
  savedPageSelectors,
  LibraryCategoryType
} from '~/store/pages'
import { removeNullable } from '~/utils'

import { userTrackMetadataFromSDK } from '../../adapters/track'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { loadNextPage } from './utils/infiniteQueryLoadNextPage'
import { primeTrackData } from './utils/primeTrackData'
import { useLineupQuery } from './utils/useLineupQuery'

const DEFAULT_PAGE_SIZE = 5

export type UseLibraryTracksArgs = {
  category: LibraryCategoryType
  sortMethod?: GetUserLibraryTracksSortMethodEnum
  sortDirection?: GetUserLibraryTracksSortDirectionEnum
  query?: string
  pageSize?: number
}

export const getLibraryTracksQueryKey = (
  args: UseLibraryTracksArgs & { currentUserId: ID | null | undefined }
) => [
  QUERY_KEYS.libraryTracks,
  {
    currentUserId: args.currentUserId,
    category: args.category,
    sortMethod: args.sortMethod,
    sortDirection: args.sortDirection,
    query: args.query
  }
]

export const useLibraryTracks = (
  {
    category,
    sortMethod,
    sortDirection,
    query,
    pageSize = DEFAULT_PAGE_SIZE
  }: UseLibraryTracksArgs,
  config?: QueryOptions
) => {
  const { data: currentUserId } = useCurrentUserId()
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const queryData = useInfiniteQuery({
    queryKey: getLibraryTracksQueryKey({
      currentUserId,
      category,
      sortMethod,
      sortDirection,
      query
    }),
    queryFn: async ({ pageParam = 0 }) => {
      if (!currentUserId) return []
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.users.getUserLibraryTracks({
        id: Id.parse(currentUserId),
        offset: pageParam,
        limit: pageSize,
        type: category,
        sortMethod,
        sortDirection,
        query
      })

      const tracks = data
        ?.map((activity) => userTrackMetadataFromSDK(activity.item))
        .filter(removeNullable)

      primeTrackData({ tracks, queryClient, dispatch })

      // Update lineup when new data arrives
      dispatch(
        savedPageTracksLineupActions.fetchLineupMetadatas(
          pageParam,
          pageSize,
          false,
          { tracks }
        )
      )

      return tracks
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    initialPageParam: 0,
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!currentUserId
  })

  const lineupData = useLineupQuery({
    queryData,
    lineupActions: savedPageTracksLineupActions,
    lineupSelector: savedPageSelectors.getSavedTracksLineup,
    playbackSource: PlaybackSource.TRACK_TILE
  })

  return {
    ...queryData,
    ...lineupData,
    loadNextPage: loadNextPage(queryData),
    pageSize
  }
}
