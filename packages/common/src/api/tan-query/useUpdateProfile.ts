import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { merge } from 'lodash'

import { userMetadataToSdk } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { Feature } from '~/models/ErrorReporting'
import { UserMetadata, WriteableUserMetadata } from '~/models/User'
import { dataURLtoFile } from '~/utils'
import { squashNewLines } from '~/utils/formatUtil'

import { QUERY_KEYS } from './queryKeys'
import { useCurrentUserId } from './useCurrentUserId'
import { getUserQueryKey } from './useUser'
import { getUserByHandleQueryKey } from './useUserByHandle'

export type MutationContext = {
  previousMetadata: UserMetadata | undefined
}

export const useUpdateProfile = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()

  return useMutation({
    mutationFn: async (metadata: WriteableUserMetadata) => {
      const sdk = await audiusSdk()
      metadata.bio = squashNewLines(metadata.bio ?? null)

      // Get existing metadata and combine with it
      if (metadata.metadata_multihash) {
        try {
          const response = await sdk.full.cidData.getMetadata({
            metadataId: metadata.metadata_multihash
          })
          if (response?.data?.data) {
            const collectibles = metadata.collectibles
            Object.assign(metadata, merge(response.data.data, metadata))
            metadata.collectibles = collectibles
          }
        } catch (e) {
          // Although we failed to fetch the existing user metadata, this should only
          // happen if the user's account data is unavailable across the whole network.
          // In favor of availability, we write anyway.
          console.error(e)
        }
      }

      // For base64 images (coming from native), convert to a blob
      if (metadata.updatedCoverPhoto?.type === 'base64') {
        const file = await dataURLtoFile(
          metadata.updatedCoverPhoto.file as unknown as string
        )
        if (file) {
          metadata.updatedCoverPhoto.file = file
        }
      }

      if (metadata.updatedProfilePicture?.type === 'base64') {
        const file = await dataURLtoFile(
          metadata.updatedProfilePicture.file as unknown as string
        )
        if (file) {
          metadata.updatedProfilePicture.file = file
        }
      }

      const { blockHash, blockNumber } = await sdk.users.updateProfile({
        userId: Id.parse(currentUserId),
        profilePictureFile: metadata.updatedProfilePicture?.file,
        coverArtFile: metadata.updatedCoverPhoto?.file,
        metadata: userMetadataToSdk(metadata)
      })

      // Wait for transaction confirmation
      const confirmed = await sdk.services.entityManager.confirmWrite({
        blockHash,
        blockNumber
      })

      if (!confirmed) {
        throw new Error(
          `Could not confirm update profile for user id ${currentUserId}`
        )
      }

      // Fetch updated user data
      const { data: userData = [] } = await sdk.full.users.getUser({
        id: Id.parse(currentUserId),
        userId: Id.parse(currentUserId)
      })

      return userData[0]
    },
    onMutate: async (metadata): Promise<MutationContext> => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [QUERY_KEYS.user, currentUserId]
      })

      // Snapshot the previous values
      const previousMetadata = queryClient.getQueryData<UserMetadata>(
        getUserQueryKey(currentUserId)
      )

      // Optimistically update user data
      if (previousMetadata) {
        queryClient.setQueryData(getUserQueryKey(currentUserId), {
          ...previousMetadata,
          ...metadata
        })

        // Also update user by handle if it exists
        if (previousMetadata.handle) {
          queryClient.setQueryData(
            getUserByHandleQueryKey(previousMetadata.handle),
            (old: any) => ({
              ...old,
              ...metadata
            })
          )
        }
      }

      return { previousMetadata }
    },
    onError: (error, metadata, context?: MutationContext) => {
      // If the mutation fails, roll back user data
      if (context?.previousMetadata) {
        queryClient.setQueryData(getUserQueryKey(currentUserId), {
          ...context.previousMetadata,
          ...metadata
        })

        // Roll back user by handle data
        if (context.previousMetadata.handle) {
          queryClient.setQueryData(
            getUserByHandleQueryKey(context.previousMetadata.handle),
            context.previousMetadata
          )
        }
      }

      reportToSentry({
        error,
        additionalInfo: {
          metadata
        },
        feature: Feature.Edit,
        name: 'Edit Profile'
      })
    },
    onSettled: (_, __) => {
      // Always refetch after error or success to ensure cache is in sync with server
      // queryClient.invalidateQueries({
      //   queryKey: [QUERY_KEYS.user, currentUserId]
      // })
    }
  })
}
