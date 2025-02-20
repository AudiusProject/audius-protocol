import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { Name } from '@audius/common/models'
import { accountActions, make } from '@audius/common/store'
import { useAudiusQueryContext } from '~/audius-query'
import { Feature } from '~/models/ErrorReporting'
import { ID } from '~/models/Identifiers'
import { Track } from '~/models/Track'

import { useCurrentUserId } from './useCurrentUserId'
import { getTrackQueryKey } from './useTrack'
import { useUser } from './useUser'

type FavoriteTrackArgs = {
  trackId: ID
  source?: string
  isFeed?: boolean
}

export const useFavoriteTrack = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const { data: currentUserId } = useCurrentUserId()
  const { data: currentUser } = useUser(currentUserId)

  return useMutation({
    mutationFn: async ({ trackId }: FavoriteTrackArgs) => {
      if (!currentUserId) throw new Error('User ID is required')
      const sdk = await audiusSdk()
      await sdk.tracks.favoriteTrack({
        trackId: Id.parse(trackId),
        userId: Id.parse(currentUserId)
      })
    },
    onMutate: async ({ trackId, source, isFeed }: FavoriteTrackArgs) => {
      if (!currentUserId || !currentUser) throw new Error('User ID is required')

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: getTrackQueryKey(trackId) })

      // Snapshot the previous values
      const previousTrack = queryClient.getQueryData<Track>(
        getTrackQueryKey(trackId)
      )
      if (!previousTrack) throw new Error('Track not found')

      // Don't allow favoriting your own track
      if (previousTrack.owner_id === currentUserId)
        return { previousTrack, previousUser: currentUser }

      // Don't allow favoriting if already favorited
      if (previousTrack.has_current_user_saved)
        return { previousTrack, previousUser: currentUser }

      // Increment the save count
      dispatch(accountActions.incrementTrackSaveCount())

      // Track analytics event
      dispatch(
        make(Name.FAVORITE, {
          kind: 'track',
          source,
          id: trackId
        })
      )

      // Optimistically update track data
      const eagerlyUpdatedMetadata: Partial<Track> = {
        has_current_user_saved: true,
        save_count: previousTrack.save_count + 1
      }

      // Handle co-sign logic for remixes
      const remixTrack = previousTrack.remix_of?.tracks?.[0]
      const isCoSign = remixTrack?.user?.user_id === currentUserId
      if (remixTrack && isCoSign) {
        const remixOf = {
          tracks: [
            {
              ...remixTrack,
              has_remix_author_saved: true
            }
          ]
        }
        eagerlyUpdatedMetadata.remix_of = remixOf
        eagerlyUpdatedMetadata._co_sign = remixOf.tracks[0]
      }

      queryClient.setQueryData(getTrackQueryKey(trackId), {
        ...previousTrack,
        ...eagerlyUpdatedMetadata
      })

      return { previousTrack, previousUser: currentUser }
    },
    onSuccess: async (_, { trackId, source }) => {
      // Handle co-sign events after successful save
      const track = queryClient.getQueryData<Track>(getTrackQueryKey(trackId))
      if (!track) return

      const remixTrack = track.remix_of?.tracks?.[0]
      const isCoSign = remixTrack?.user?.user_id === currentUserId
      if (isCoSign) {
        const parentTrackId = remixTrack.parent_track_id
        const hasAlreadyCoSigned =
          remixTrack.has_remix_author_reposted ||
          remixTrack.has_remix_author_saved

        const parentTrack = queryClient.getQueryData<Track>(
          getTrackQueryKey(parentTrackId)
        )

        // Dispatch co-sign events
        dispatch(
          make(Name.REMIX_COSIGN_INDICATOR, {
            id: trackId,
            handle: currentUser?.handle,
            original_track_id: parentTrack?.track_id,
            original_track_title: parentTrack?.title,
            action: 'favorited'
          })
        )

        if (!hasAlreadyCoSigned) {
          dispatch(
            make(Name.REMIX_COSIGN, {
              id: trackId,
              handle: currentUser?.handle,
              original_track_id: parentTrack?.track_id,
              original_track_title: parentTrack?.title,
              action: 'favorited'
            })
          )
        }
      }
    },
    onError: (error, { trackId }, context) => {
      if (!context) return

      // Revert optimistic updates
      queryClient.setQueryData(getTrackQueryKey(trackId), context.previousTrack)
      dispatch(accountActions.decrementTrackSaveCount())

      reportToSentry({
        error,
        additionalInfo: { trackId },
        name: 'Favorite Track',
        feature: Feature.Social
      })
    }
  })
}
