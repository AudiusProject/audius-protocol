import { Id, OptionalId } from '@audius/sdk'
import {
  useInfiniteQuery,
  useQueryClient,
  InfiniteData,
  UseInfiniteQueryResult
} from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'
import { ID, PlaybackSource } from '~/models'
import { UserTrackMetadata } from '~/models/Track'
import { trackPageSelectors } from '~/store/pages'
import { tracksActions } from '~/store/pages/track/lineup/actions'

import { useLineupQuery } from '../lineups/useLineupQuery'
import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, QueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'
import { primeTrackData } from '../utils/primeTrackData'

const DEFAULT_PAGE_SIZE = 6

export const getTrackPageLineupQueryKey = (
  trackId: ID | null | undefined,
  ownerHandle: string | null | undefined
) =>
  [QUERY_KEYS.trackPageLineup, trackId, ownerHandle] as unknown as QueryKey<
    InfiniteData<TrackPageData>
  >

type UseTrackPageLineupArgs = {
  trackId: ID | null | undefined
  ownerHandle: string | null | undefined
  pageSize?: number
}

type TrackIndices = {
  mainTrackIndex: number | null
  remixParentIndex: number | null
  remixesStartIndex: number | null
  moreByTracksStartIndex: number | null
  recommendedTracksStartIndex: number | null
}

type TrackPageData = {
  tracks: UserTrackMetadata[]
  indices: TrackIndices
}

export const useTrackPageLineup = (
  {
    trackId,
    ownerHandle,
    pageSize = DEFAULT_PAGE_SIZE
  }: UseTrackPageLineupArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const queryData = useInfiniteQuery({
    queryKey: getTrackPageLineupQueryKey(trackId, ownerHandle),
    initialPageParam: 0,
    getNextPageParam: () => undefined, // Always return undefined to indicate no more pages
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const tracks: UserTrackMetadata[] = []
      const indices: TrackIndices = {
        mainTrackIndex: null,
        remixParentIndex: null,
        remixesStartIndex: null,
        moreByTracksStartIndex: null,
        recommendedTracksStartIndex: null
      }

      // First get the hero track
      const heroTrack = trackId
        ? await sdk.full.tracks.getTrack({
            trackId: Id.parse(trackId),
            userId: OptionalId.parse(currentUserId)
          })
        : null

      if (pageParam === 0 && heroTrack?.data) {
        const processedHeroTrack = userTrackMetadataFromSDK(heroTrack.data)
        if (processedHeroTrack) {
          indices.mainTrackIndex = 0
          tracks.push(processedHeroTrack)

          // If hero track is a remix, get the parent track
          const heroTrackRemixParentTrackId =
            processedHeroTrack.remix_of?.tracks?.[0]?.parent_track_id
          if (heroTrackRemixParentTrackId) {
            const remixParentTrack = await sdk.full.tracks.getTrack({
              trackId: Id.parse(heroTrackRemixParentTrackId),
              userId: OptionalId.parse(currentUserId)
            })
            const processedParentTrack = remixParentTrack?.data
              ? userTrackMetadataFromSDK(remixParentTrack.data)
              : undefined
            if (processedParentTrack) {
              indices.remixParentIndex = tracks.length
              tracks.push(processedParentTrack)
            }
          } else {
            // If hero track is remixable (not a remix), get its remixes
            const { data: remixesData } = await sdk.full.tracks.getTrackRemixes(
              {
                trackId: Id.parse(trackId),
                userId: OptionalId.parse(currentUserId),
                limit: pageSize,
                offset: 0
              }
            )

            if (remixesData?.tracks) {
              const processedRemixes = transformAndCleanList(
                remixesData.tracks,
                userTrackMetadataFromSDK
              )
              if (processedRemixes.length > 0) {
                indices.remixesStartIndex = tracks.length
                tracks.push(...processedRemixes.slice(0, pageSize))
              }
            }
          }
        }
      }

      // Get more tracks by the artist
      if (ownerHandle) {
        const { data = [] } = await sdk.full.users.getTracksByUserHandle({
          handle: ownerHandle,
          userId: OptionalId.parse(currentUserId),
          sort: 'plays',
          limit: pageSize,
          offset: 0
        })

        const processedTracks = transformAndCleanList(
          data,
          userTrackMetadataFromSDK
        )
          .filter(
            (track) =>
              !tracks.some(
                (existingTrack) => existingTrack.track_id === track.track_id
              )
          )
          .slice(0, pageSize)

        if (processedTracks.length > 0) {
          indices.moreByTracksStartIndex = tracks.length
          tracks.push(...processedTracks)
        }
      }

      // If there are no remixes, get recommended tracks based on genre
      if (indices.remixesStartIndex === null && heroTrack?.data) {
        const { data: trendingData } = await sdk.full.tracks.getTrendingTracks({
          genre: heroTrack.data.genre ?? undefined,
          limit: pageSize,
          offset: 0
        })

        if (trendingData) {
          const processedTracks = transformAndCleanList(
            trendingData,
            userTrackMetadataFromSDK
          ).filter(
            (track) =>
              !tracks.some(
                (existingTrack) => existingTrack.track_id === track.track_id
              ) && track.track_id !== Number(trackId)
          )

          if (processedTracks.length > 0) {
            indices.recommendedTracksStartIndex = tracks.length
            tracks.push(...processedTracks)
          }
        }
      }

      primeTrackData({ tracks, queryClient, dispatch })

      dispatch(
        tracksActions.fetchLineupMetadatas(0, pageSize, false, {
          tracks,
          indices
        })
      )

      return { tracks, indices }
    },
    ...options,
    enabled: options?.enabled !== false && !!ownerHandle && !!trackId
  })

  const indices = queryData.data?.pages?.[0]?.indices
  const queryDataWithFlatData = queryData as unknown as UseInfiniteQueryResult<
    UserTrackMetadata[],
    Error
  >
  queryDataWithFlatData.data = queryData.data?.pages
    .map((page) => page.tracks)
    .flat()

  const lineupData = useLineupQuery({
    queryData: queryDataWithFlatData,
    queryKey: getTrackPageLineupQueryKey(trackId, ownerHandle),
    lineupActions: tracksActions,
    lineupSelector: trackPageSelectors.getLineup,
    playbackSource: PlaybackSource.TRACK_TILE,
    pageSize
  })

  return {
    ...lineupData,
    indices,
    hasNextPage: false // Override hasNextPage to always be false
  }
}
