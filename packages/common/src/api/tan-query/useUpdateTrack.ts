import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useStore } from 'react-redux'

import { fileToSdk, trackMetadataForUploadToSdk } from '~/adapters/track'
import { useAudiusQueryContext } from '~/audius-query'
import { useFeatureFlag } from '~/hooks/useFeatureFlag'
import { Track, UserTrackMetadata } from '~/models'
import { Feature } from '~/models/ErrorReporting'
import { ID } from '~/models/Identifiers'
import { FeatureFlags } from '~/services/remote-config'
import { CommonState } from '~/store/commonStore'
import { stemsUploadSelectors } from '~/store/stems-upload'
import { TrackMetadataForUpload } from '~/store/upload'
import { squashNewLines } from '~/utils/formatUtil'
import { formatMusicalKey } from '~/utils/musicalKeys'

import { QUERY_KEYS } from './queryKeys'
import { useCurrentUser } from './useCurrentUser'
import { useDeleteTrack } from './useDeleteTrack'
import { useGetOrCreateUserBank } from './useGetOrCreateUserBank'
import { getTrackQueryKey } from './useTrack'
import { handleStemUpdates } from './utils'
import { addPremiumMetadata } from './utils/addPremiumMetadata'
import { primeTrackData } from './utils/primeTrackData'
const { getCurrentUploads } = stemsUploadSelectors

type MutationContext = {
  previousTrack: Track | undefined
}

export type UpdateTrackParams = {
  trackId: ID
  userId: ID
  metadata: Partial<Track>
  coverArtFile?: File
}

export const useUpdateTrack = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const store = useStore()
  const { data: currentUser } = useCurrentUser()
  const { mutate: deleteTrack } = useDeleteTrack()
  const { data: userBank } = useGetOrCreateUserBank(
    currentUser?.erc_wallet ?? currentUser?.wallet
  )
  const { isEnabled: isUsdcPurchaseEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES
  )

  return useMutation({
    mutationFn: async ({
      trackId,
      userId,
      metadata,
      coverArtFile
    }: UpdateTrackParams) => {
      const sdk = await audiusSdk()

      const previousMetadata = queryClient.getQueryData<UserTrackMetadata>([
        QUERY_KEYS.track,
        trackId
      ])

      // Create a mutable copy of metadata
      let updatedMetadata = {
        ...metadata
      } as Partial<Track>

      // Apply squashNewLines to description
      if (updatedMetadata.description) {
        updatedMetadata.description = squashNewLines(
          updatedMetadata.description
        )
      }

      // Handle publishing state for unlisted to listed transition
      if (
        previousMetadata &&
        previousMetadata.is_unlisted &&
        updatedMetadata.is_unlisted === false
      ) {
        // Mark track as publishing
        updatedMetadata._is_publishing = true
      }

      // Add premium metadata if needed
      const userWallet = currentUser?.erc_wallet || currentUser?.wallet
      if (userWallet && isUsdcPurchaseEnabled) {
        updatedMetadata = await addPremiumMetadata(
          updatedMetadata,
          userWallet,
          userBank
        )
      }

      // Format musical key
      if (updatedMetadata.musical_key) {
        updatedMetadata.musical_key =
          formatMusicalKey(updatedMetadata.musical_key) ?? null

        // Set custom musical key flag if it's changed or was already set
        if (previousMetadata) {
          updatedMetadata.is_custom_musical_key =
            previousMetadata.is_custom_musical_key ||
            (!!updatedMetadata.musical_key &&
              updatedMetadata.musical_key !== previousMetadata.musical_key)
        }
      }

      // Format BPM
      if (updatedMetadata.bpm) {
        updatedMetadata.bpm = Number(updatedMetadata.bpm)

        // Set custom BPM flag if it's changed or was already set
        if (previousMetadata) {
          updatedMetadata.is_custom_bpm =
            previousMetadata.is_custom_bpm ||
            (!!updatedMetadata.bpm &&
              updatedMetadata.bpm !== previousMetadata.bpm)
        }
      }

      const sdkMetadata = trackMetadataForUploadToSdk(
        updatedMetadata as TrackMetadataForUpload
      )

      // Determine if we need to generate a preview
      const generatePreview =
        previousMetadata &&
        ((updatedMetadata.preview_start_seconds !== null &&
          updatedMetadata.preview_start_seconds !== undefined &&
          previousMetadata.preview_start_seconds !==
            updatedMetadata.preview_start_seconds) ||
          previousMetadata.track_cid !== updatedMetadata.track_cid)

      const response = await sdk.tracks.updateTrack({
        coverArtFile: coverArtFile
          ? fileToSdk(coverArtFile, 'cover_art')
          : undefined,
        trackId: Id.parse(trackId),
        userId: Id.parse(userId),
        metadata: sdkMetadata,
        generatePreview: generatePreview || undefined
      })

      // TODO: migrate stem uploads to use tan-query
      const inProgressStemUploads = getCurrentUploads(
        store.getState() as CommonState,
        trackId
      )
      if (previousMetadata) {
        handleStemUpdates(
          updatedMetadata,
          previousMetadata as any,
          inProgressStemUploads,
          (trackId: ID) => deleteTrack({ trackId }),
          dispatch
        )
      }

      // Handle remix event tracking
      const isNewRemix =
        updatedMetadata?.remix_of?.tracks?.[0]?.parent_track_id &&
        previousMetadata?.remix_of?.tracks?.[0]?.parent_track_id !==
          updatedMetadata?.remix_of?.tracks?.[0]?.parent_track_id

      if (isNewRemix) {
        // TODO: Implement remix event tracking similar to trackNewRemixEvent saga
      }

      // If the track was unlisted and is now public, mark it as no longer publishing
      if (
        previousMetadata?.is_unlisted &&
        updatedMetadata.is_unlisted === false
      ) {
        updatedMetadata._is_publishing = false
      }

      return response
    },
    onMutate: async ({ trackId, metadata }): Promise<MutationContext> => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: getTrackQueryKey(trackId)
      })

      // Snapshot the previous values
      const previousTrack = queryClient.getQueryData<UserTrackMetadata>([
        QUERY_KEYS.track,
        trackId
      ])

      // Apply the same transformations for optimistic updates
      const optimisticMetadata = { ...metadata } as Partial<Track>

      // Apply squashNewLines to description
      if (optimisticMetadata.description) {
        optimisticMetadata.description = squashNewLines(
          optimisticMetadata.description
        )
      }

      // Handle publishing state for unlisted to listed transition
      if (
        previousTrack &&
        previousTrack.is_unlisted &&
        optimisticMetadata.is_unlisted === false
      ) {
        optimisticMetadata._is_publishing = true
      }

      // Format musical key
      if (optimisticMetadata.musical_key) {
        optimisticMetadata.musical_key =
          formatMusicalKey(optimisticMetadata.musical_key) ?? null
      }

      // Format BPM
      if (optimisticMetadata.bpm) {
        optimisticMetadata.bpm = Number(optimisticMetadata.bpm)
      }

      // Optimistically update track
      if (previousTrack) {
        primeTrackData({
          tracks: [
            { ...previousTrack, ...optimisticMetadata }
          ] as UserTrackMetadata[],
          queryClient,
          dispatch,
          forceReplace: true
        })
      }

      // Return context with the previous track and metadata
      return { previousTrack }
    },
    onError: (
      error,
      { trackId, userId, metadata },
      context?: MutationContext
    ) => {
      // If the mutation fails, roll back track data
      if (context?.previousTrack) {
        queryClient.setQueryData(
          getTrackQueryKey(trackId),
          context.previousTrack
        )
      }

      // Roll back all collections that contain this track
      queryClient.setQueriesData(
        { queryKey: [QUERY_KEYS.collection] },
        (oldData: any) => {
          if (!oldData?.tracks?.some((track: any) => track.id === trackId)) {
            return oldData
          }

          return {
            ...oldData,
            tracks: oldData.tracks.map((track: any) =>
              track.id === trackId ? context?.previousTrack : track
            )
          }
        }
      )

      reportToSentry({
        error,
        additionalInfo: {
          trackId,
          userId,
          metadata
        },
        feature: Feature.Edit,
        name: 'Edit Track'
      })
    },
    onSettled: (_, __, { trackId }) => {
      // Always refetch after error or success to ensure cache is in sync with server
      // queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.track, trackId] })
    }
  })
}
