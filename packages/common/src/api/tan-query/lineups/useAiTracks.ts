import { useEffect } from 'react'

import { EntityType, OptionalId } from '@audius/sdk'
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient
} from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'
import { PlaybackSource } from '~/models'
import { aiPageLineupActions, aiPageSelectors } from '~/store/pages'
import { fetchAiUser } from '~/store/pages/ai/slice'

import { QUERY_KEYS } from '../queryKeys'
import { LineupData, QueryKey, QueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'
import { primeTrackData } from '../utils/primeTrackData'

import { useLineupQuery } from './useLineupQuery'

const DEFAULT_PAGE_SIZE = 10

type UseAiTracksArgs = {
  handle: string
  pageSize?: number
}

export const getAiTracksQueryKey = ({
  handle,
  pageSize = DEFAULT_PAGE_SIZE
}: UseAiTracksArgs) =>
  [QUERY_KEYS.aiTracks, handle, { pageSize }] as unknown as QueryKey<
    InfiniteData<LineupData[]>
  >

export const useAiTracks = (
  { handle, pageSize = DEFAULT_PAGE_SIZE }: UseAiTracksArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchAiUser({ handle }))
  }, [dispatch, handle])

  const queryData = useInfiniteQuery({
    queryKey: getAiTracksQueryKey({ handle, pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: LineupData[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()

      const { data: tracks } =
        await sdk.full.users.getAIAttributedTracksByUserHandle({
          handle,
          userId: OptionalId.parse(currentUserId),
          limit: pageSize,
          offset: pageParam,
          filterTracks: 'public',
          sort: 'date'
        })

      if (!tracks) return []

      const processedTracks = transformAndCleanList(
        tracks,
        userTrackMetadataFromSDK
      )
      primeTrackData({ tracks: processedTracks, queryClient, dispatch })

      // Update lineup when new data arrives
      dispatch(
        aiPageLineupActions.fetchLineupMetadatas(pageParam, pageSize, false, {
          tracks: processedTracks
        })
      )

      return processedTracks.map((t) => ({
        id: t.track_id,
        type: EntityType.TRACK
      }))
    },
    select: (data) => data?.pages.flat(),
    ...options,
    enabled: options?.enabled !== false && !!handle
  })

  return useLineupQuery({
    lineupData: queryData.data ?? [],
    queryData,
    queryKey: getAiTracksQueryKey({
      handle,
      pageSize
    }),
    lineupActions: aiPageLineupActions,
    lineupSelector: aiPageSelectors.getLineup,
    playbackSource: PlaybackSource.TRACK_TILE,
    pageSize
  })
}
