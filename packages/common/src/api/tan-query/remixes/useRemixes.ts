import { useEffect } from 'react'

import { Id, OptionalId, EntityType, full } from '@audius/sdk'
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient
} from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { transformAndCleanList, userTrackMetadataFromSDK } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'
import { PlaybackSource } from '~/models/Analytics'
import {
  remixesPageLineupActions,
  remixesPageSelectors,
  remixesPageActions
} from '~/store/pages'

import { useLineupQuery } from '../lineups/useLineupQuery'
import { QUERY_KEYS } from '../queryKeys'
import { getTrackQueryKey } from '../tracks/useTrack'
import { QueryKey, QueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'
import { getUserQueryKey } from '../users/useUser'
import { primeTrackData } from '../utils/primeTrackData'

const DEFAULT_PAGE_SIZE = 10

export type UseRemixesArgs = {
  trackId: number | null | undefined
  includeOriginal?: Boolean
  pageSize?: number
  sortMethod?: full.GetTrackRemixesSortMethodEnum
  isCosign?: boolean
  isContestEntry?: boolean
}

type RemixesQueryData = {
  count: number
  tracks: { id: ID; type: EntityType }[]
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
  ] as unknown as QueryKey<InfiniteData<RemixesQueryData[]>>

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
    getNextPageParam: (lastPage: RemixesQueryData, allPages) => {
      const isSecondPage = allPages.length === 1
      if (
        lastPage?.tracks?.length < pageSize ||
        (isSecondPage && includeOriginal && lastPage?.tracks?.length - 1 === 0)
      )
        return undefined
      return allPages.reduce((acc, page) => acc + page.tracks.length, 0)
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

      return {
        tracks: processedTracks.map((t) => ({
          id: t.track_id,
          type: EntityType.TRACK
        })),
        count: data.count
      }
    },
    ...options,
    enabled: options?.enabled !== false && !!trackId
  })

  const lineupData = useLineupQuery({
    lineupData: queryData.data?.pages.flatMap((page) => page.tracks) ?? [],
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

  return {
    ...lineupData,
    count: queryData.data?.pages[0]?.count
  }
}
