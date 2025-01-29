import { Id, OptionalId } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'
import { ID, PlaybackSource } from '~/models'
import { UserTrackMetadata } from '~/models/Track'
import { trackPageSelectors } from '~/store/pages'
import { tracksActions } from '~/store/pages/track/lineup/actions'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { loadNextPage } from './utils/infiniteQueryLoadNextPage'
import { primeTrackData } from './utils/primeTrackData'
import { useLineupQuery } from './utils/useLineupQuery'

const DEFAULT_PAGE_SIZE = 6

type UseTrackPageLineupArgs = {
  trackId: ID | null | undefined
  ownerHandle: string | null | undefined
  pageSize?: number
}

export const useTrackPageLineup = (
  {
    trackId,
    ownerHandle,
    pageSize = DEFAULT_PAGE_SIZE
  }: UseTrackPageLineupArgs,
  config?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const queryData = useInfiniteQuery({
    queryKey: [QUERY_KEYS.trackPageLineup, trackId, ownerHandle],
    initialPageParam: 0,
    getNextPageParam: (lastPage: UserTrackMetadata[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const tracks: UserTrackMetadata[] = []

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
              tracks.push(...processedRemixes.slice(0, pageSize))
            }
          }
        }
      }

      // Calculate offset for more by artist tracks
      let moreByArtistTracksOffset = 0
      if (pageParam === 0) {
        moreByArtistTracksOffset = 0
      } else {
        const existingTracksCount = tracks.length
        moreByArtistTracksOffset = Math.max(0, pageParam - existingTracksCount)
      }

      // Get more tracks by the artist if we haven't filled up our page yet
      if (ownerHandle && tracks.length < pageSize) {
        const remainingSlots = pageSize - tracks.length
        const { data = [] } = await sdk.full.users.getTracksByUserHandle({
          handle: ownerHandle,
          userId: OptionalId.parse(currentUserId),
          sort: 'plays',
          limit: remainingSlots + 2,
          offset: moreByArtistTracksOffset
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
          .slice(0, remainingSlots)

        tracks.push(...processedTracks)
      }

      primeTrackData({ tracks, queryClient, dispatch })

      dispatch(
        tracksActions.fetchLineupMetadatas(0, pageSize, false, {
          tracks
        })
      )

      return tracks
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!ownerHandle
  })

  const lineupData = useLineupQuery({
    queryData,
    lineupActions: tracksActions,
    lineupSelector: trackPageSelectors.getLineup,
    playbackSource: PlaybackSource.TRACK_TILE
  })

  return {
    ...queryData,
    ...lineupData,
    loadNextPage: loadNextPage(queryData),
    pageSize
  }
}
