import { useMemo } from 'react'

import { EntityType, Id, OptionalId } from '@audius/sdk'
import {
  useInfiniteQuery,
  useQueryClient,
  InfiniteData
} from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'
import { ID, PlaybackSource } from '~/models'
import { UserTrackMetadata } from '~/models/Track'
import { trackPageSelectors } from '~/store/pages'
import { tracksActions } from '~/store/pages/track/lineup/actions'

import { QUERY_KEYS } from './queryKeys'
import { QueryKey, QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { useTrack } from './useTrack'
import { useUser } from './useUser'
import { primeTrackData } from './utils/primeTrackData'
import { useLineupQuery } from './utils/useLineupQuery'

const DEFAULT_PAGE_SIZE = 6

export const getTrackPageLineupQueryKey = (trackId: ID | null | undefined) =>
  [QUERY_KEYS.trackPageLineup, trackId] as unknown as QueryKey<
    InfiniteData<TrackPageData>
  >

type UseTrackPageLineupArgs = {
  trackId: ID | null | undefined
  pageSize?: number
  disableAutomaticCacheHandling?: boolean
}

type TrackIndices = {
  mainTrackIndex: number | undefined
  remixParentSection: {
    index: number | undefined
    pageSize: number | undefined
  }
  remixesSection: {
    index: number | undefined
    pageSize: number | undefined
  }
  moreBySection: {
    index: number | undefined
    pageSize: number | undefined
  }
  recommendedSection: {
    index: number | undefined
    pageSize: number | undefined
  }
}

type TrackPageData = {
  tracks: UserTrackMetadata[]
  indices: TrackIndices
}

export const useTrackPageLineup = (
  {
    trackId,
    pageSize = DEFAULT_PAGE_SIZE,
    disableAutomaticCacheHandling = false
  }: UseTrackPageLineupArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const { data: heroTrack } = useTrack(trackId)
  const { data: ownerHandle } = useUser(heroTrack?.owner_id, {
    select: (user) => user?.handle
  })

  // Memoize the track filtering function
  const filterDuplicateTracks = useMemo(() => {
    return (
      existingTracks: UserTrackMetadata[],
      newTracks: UserTrackMetadata[]
    ) => {
      return newTracks.filter(
        (track) =>
          !existingTracks.some(
            (existingTrack) => existingTrack.track_id === track.track_id
          ) && track.track_id !== trackId
      )
    }
  }, [trackId])

  const queryData = useInfiniteQuery({
    queryKey: getTrackPageLineupQueryKey(trackId),
    initialPageParam: 0,
    getNextPageParam: () => undefined,
    queryFn: async () => {
      const sdk = await audiusSdk()
      const tracks: UserTrackMetadata[] = []
      const indices: TrackIndices = {
        mainTrackIndex: undefined,
        remixParentSection: { index: undefined, pageSize: undefined },
        remixesSection: { index: undefined, pageSize: undefined },
        moreBySection: { index: undefined, pageSize: undefined },
        recommendedSection: { index: undefined, pageSize: undefined }
      }

      if (!heroTrack || !ownerHandle) return { tracks: [], indices }

      tracks.push(heroTrack as UserTrackMetadata)
      indices.mainTrackIndex = 0

      const heroTrackRemixParentTrackId =
        heroTrack.remix_of?.tracks?.[0]?.parent_track_id

      // Parallelize API calls where possible
      const [remixParentTrackResult, remixesResult, moreByArtistResult] =
        await Promise.all([
          // Get parent track if it's a remix
          heroTrackRemixParentTrackId
            ? sdk.full.tracks.getTrack({
                trackId: Id.parse(heroTrackRemixParentTrackId),
                userId: OptionalId.parse(currentUserId)
              })
            : Promise.resolve(null),
          // Get remixes if not a remix
          !heroTrackRemixParentTrackId
            ? sdk.full.tracks.getTrackRemixes({
                trackId: Id.parse(trackId),
                userId: OptionalId.parse(currentUserId),
                limit: pageSize,
                offset: 0
              })
            : Promise.resolve(null),
          // Get more tracks by artist (always fetch)
          sdk.full.users.getTracksByUserHandle({
            handle: ownerHandle,
            userId: OptionalId.parse(currentUserId),
            sort: 'plays',
            limit: pageSize,
            offset: 0
          })
        ])

      // Process parent track if exists
      if (remixParentTrackResult?.data) {
        const processedParentTrack = userTrackMetadataFromSDK(
          remixParentTrackResult.data
        ) as UserTrackMetadata
        indices.remixParentSection.index = tracks.length
        tracks.push(processedParentTrack)
        indices.remixParentSection.pageSize = 1
      }

      // Process remixes if exist
      if (remixesResult?.data?.tracks) {
        const processedRemixes = transformAndCleanList(
          remixesResult.data.tracks,
          userTrackMetadataFromSDK
        )
        if (processedRemixes.length > 0) {
          indices.remixesSection.index = tracks.length
          tracks.push(...processedRemixes)
          indices.remixesSection.pageSize = processedRemixes.length
        }
      }

      // Process more by artist tracks
      const processedMoreByArtist = transformAndCleanList(
        moreByArtistResult.data || [],
        userTrackMetadataFromSDK
      )
      const filteredMoreByArtist = filterDuplicateTracks(
        tracks,
        processedMoreByArtist
      ).slice(0, pageSize)

      if (filteredMoreByArtist.length > 0) {
        indices.moreBySection.index = tracks.length
        tracks.push(...filteredMoreByArtist)
        indices.moreBySection.pageSize = filteredMoreByArtist.length
      }

      // Only fetch recommended if no remixes
      if (!indices.remixesSection.index) {
        const { data: trendingData } = await sdk.full.tracks.getTrendingTracks({
          genre: heroTrack.genre,
          limit: pageSize
        })

        if (trendingData) {
          const processedTracks = transformAndCleanList(
            trendingData,
            userTrackMetadataFromSDK
          )
          const filteredRecommended = filterDuplicateTracks(
            tracks,
            processedTracks
          )

          if (filteredRecommended.length > 0) {
            indices.recommendedSection.index = tracks.length
            tracks.push(...filteredRecommended)
            indices.recommendedSection.pageSize = filteredRecommended.length
          }
        }
      }

      primeTrackData({ tracks, queryClient, dispatch })

      dispatch(
        tracksActions.fetchLineupMetadatas(0, pageSize, false, {
          items: tracks,
          indices
        })
      )

      return {
        tracks: tracks.map((track) => ({
          id: track.track_id,
          type: EntityType.TRACK
        })),
        indices
      }
    },
    ...options,
    enabled: options?.enabled !== false && !!ownerHandle && !!trackId
  })

  const indices = queryData.data?.pages?.[0]?.indices

  const lineupData = useLineupQuery({
    lineupData: queryData.data?.pages.flatMap((page) => page.tracks) ?? [],
    queryData,
    queryKey: getTrackPageLineupQueryKey(trackId),
    lineupActions: tracksActions,
    lineupSelector: trackPageSelectors.getLineup,
    playbackSource: PlaybackSource.TRACK_TILE,
    pageSize,
    disableAutomaticCacheHandling
  })

  return {
    ...lineupData,
    indices,
    hasNextPage: false // Override hasNextPage to always be false
  }
}
