import { useEffect } from 'react'

import { OptionalId } from '@audius/sdk'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { transformAndCleanList, userTrackMetadataFromSDK } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { PlaybackSource } from '~/models/Analytics'
import { UserTrackMetadata } from '~/models/Track'
import { aiPageLineupActions, aiPageSelectors } from '~/store/pages'
import { fetchAiUser } from '~/store/pages/ai/slice'

import { useTypedQueryClient } from './typed-query-client'
import { QUERY_KEYS } from './typed-query-client/queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeTrackData } from './utils/primeTrackData'
import { useLineupQuery } from './utils/useLineupQuery'

const DEFAULT_PAGE_SIZE = 10

type UseAiTracksArgs = {
  handle: string
  pageSize?: number
}

export const getAiTracksQueryKey = ({
  handle,
  pageSize = DEFAULT_PAGE_SIZE
}: UseAiTracksArgs) => [QUERY_KEYS.aiTracks, handle, { pageSize }] as const

export const useAiTracks = (
  { handle, pageSize = DEFAULT_PAGE_SIZE }: UseAiTracksArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useTypedQueryClient()
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchAiUser({ handle }))
  }, [dispatch, handle])

  const queryData = useInfiniteQuery({
    queryKey: getAiTracksQueryKey({ handle, pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: UserTrackMetadata[], allPages) => {
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

      return processedTracks
    },
    select: (data) => data?.pages.flat(),
    ...options,
    enabled: options?.enabled !== false && !!handle
  })

  return useLineupQuery({
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
