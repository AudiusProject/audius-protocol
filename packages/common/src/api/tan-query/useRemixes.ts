import { useEffect } from 'react'

import { Id, OptionalId, EntityType, full } from '@audius/sdk'
import {
  dataTagSymbol,
  InfiniteData,
  useInfiniteQuery,
  useQueryClient
} from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { transformAndCleanList, userTrackMetadataFromSDK } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { PlaybackSource } from '~/models/Analytics'
import {
  remixesPageLineupActions,
  remixesPageSelectors,
  remixesPageActions
} from '~/store/pages'

import { QUERY_KEYS } from './queryKeys'
import { QueryKey, QueryOptions, LineupData } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { getTrackQueryKey } from './useTrack'
import { getUserQueryKey } from './useUser'
import { primeTrackData } from './utils/primeTrackData'
import { useLineupQuery } from './utils/useLineupQuery'

const DEFAULT_PAGE_SIZE = 10

export type UseRemixesArgs = {
  trackId: number | null | undefined
  includeOriginal?: Boolean
  pageSize?: number
  sortMethod?: full.GetTrackRemixesSortMethodEnum
  isCosign?: boolean
  isContestEntry?: boolean
}

export const getRemixesQueryKey = ({
  trackId,
  includeOriginal = false,
  pageSize = DEFAULT_PAGE_SIZE,
  sortMethod = 'recent',
  isCosign = false,
  isContestEntry = false
}: UseRemixesArgs) =>
  [
    QUERY_KEYS.remixes,
    trackId,
    { pageSize, includeOriginal, sortMethod, isCosign, isContestEntry }
  ] as unknown as QueryKey<InfiniteData<LineupData[]>>

export const useRemixes = (
  {
    trackId,
    includeOriginal = false,
    pageSize = DEFAULT_PAGE_SIZE,
    sortMethod = 'recent',
    isCosign = false,
    isContestEntry = false
  }: UseRemixesArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  useEffect(() => {
    if (trackId) {
      dispatch(remixesPageActions.fetchTrackSucceeded({ trackId }))
    }
  }, [dispatch, trackId])

  const queryData = useInfiniteQuery({
    queryKey: getRemixesQueryKey({
      trackId,
      pageSize,
      includeOriginal,
      sortMethod,
      isCosign,
      isContestEntry
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: LineupData[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const { data = { count: 0, tracks: [] } } =
        await sdk.full.tracks.getTrackRemixes({
          trackId: Id.parse(trackId),
          userId: OptionalId.parse(currentUserId),
          limit: pageSize,
          offset: pageParam,
          sortMethod,
          onlyCosigns: isCosign,
          onlyContestEntries: isContestEntry
        })
      let processedTracks = transformAndCleanList(
        data.tracks,
        userTrackMetadataFromSDK
      )
      primeTrackData({ tracks: processedTracks, queryClient, dispatch })

      if (includeOriginal && pageParam === 0) {
        const track = queryClient.getQueryData(getTrackQueryKey(trackId))
        if (track && data.tracks) {
          const user = queryClient.getQueryData(getUserQueryKey(track.owner_id))
          if (user) {
            processedTracks = [{ ...track, user }, ...processedTracks]
          }
        }
      }

      // Update lineup when new data arrives
      dispatch(
        remixesPageLineupActions.fetchLineupMetadatas(
          pageParam,
          pageSize,
          false,
          { items: processedTracks }
        )
      )
      dispatch(remixesPageActions.setCount({ count: data.count }))

      return processedTracks.map((t) => ({
        id: t.track_id,
        type: EntityType.TRACK
      }))
    },
    select: (data) => data.pages.flat(),
    ...options,
    enabled: options?.enabled !== false && !!trackId
  })

  return useLineupQuery({
    queryData,
    queryKey: getRemixesQueryKey({
      trackId,
      includeOriginal,
      pageSize,
      sortMethod,
      isCosign,
      isContestEntry
    }),
    lineupActions: remixesPageLineupActions,
    lineupSelector: remixesPageSelectors.getLineup,
    playbackSource: PlaybackSource.TRACK_TILE,
    pageSize
  })
}
