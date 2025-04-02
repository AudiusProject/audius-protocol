import { AudiusSdk, OptionalId } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { userMetadataToSdk } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { PlaylistLibrary } from '~/models/PlaylistLibrary'
import { UserMetadata } from '~/models/User'

import { getCurrentUserQueryKey } from './useCurrentUser'
import { getUserQueryKey } from './useUser'

type MutationContext = {
  previousUser: UserMetadata | undefined
  previousAccountUser: UserMetadata | undefined
}

export type UpdateUserParams = {
  userId: ID
  metadata: Partial<UserMetadata>
  profilePictureFile?: File
  coverArtFile?: File
}

export const useUpdateUser = () => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      metadata,
      coverArtFile,
      profilePictureFile
    }: UpdateUserParams) => {
      const sdk = await audiusSdk()

      return await updateUser(
        sdk,
        userId,
        metadata,
        coverArtFile,
        profilePictureFile
      )
    },
    onMutate: async ({ userId, metadata }): Promise<MutationContext> => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: getUserQueryKey(userId) })

      // Snapshot the previous values
      const previousUser = queryClient.getQueryData(getUserQueryKey(userId))

      // Snapshot the previous account user if it matches
      const previousAccountUser = queryClient
        .getQueriesData<UserMetadata>({
          queryKey: getCurrentUserQueryKey(userId.toString())
        })
        .find(([_, data]) => data?.user_id === userId)?.[1]

      // Optimistically update user
      queryClient.setQueryData(getUserQueryKey(userId), (old: any) => ({
        ...old,
        ...metadata
      }))

      // Optimistically update accountUser queries if they match the user
      queryClient.setQueriesData(
        { queryKey: getCurrentUserQueryKey(userId.toString()) },
        (oldData: any) => {
          if (!oldData?.user_id || oldData.user_id !== userId) return oldData
          return { ...oldData, ...metadata }
        }
      )

      // Return context with the previous user
      return { previousUser, previousAccountUser }
    },
    onError: (_err, { userId }, context?: MutationContext) => {
      // If the mutation fails, roll back user data
      if (context?.previousUser) {
        queryClient.setQueryData(getUserQueryKey(userId), context.previousUser)
      }

      // Roll back accountUser queries if we have the previous state
      if (context?.previousAccountUser) {
        queryClient.setQueriesData(
          { queryKey: getCurrentUserQueryKey(userId.toString()) },
          (oldData: any) => {
            if (!oldData?.user_id || oldData.user_id !== userId) return oldData
            return context.previousAccountUser
          }
        )
      }
    },
    onSettled: (_, __) => {
      // Always refetch after error or success to ensure cache is in sync with server
      // queryClient.invalidateQueries({ queryKey: ['user', userId] })
    }
  })
}

export async function updateUser(
  sdk: AudiusSdk,
  userId: number,
  metadata: Partial<UserMetadata> | { playlist_library: PlaylistLibrary },
  coverArtFile?: File,
  profilePictureFile?: File
) {
  const encodedUserId = OptionalId.parse(userId)
  if (!encodedUserId) throw new Error('Invalid ID')

  const sdkMetadata = userMetadataToSdk(metadata as UserMetadata)

  const response = await sdk.users.updateProfile({
    coverArtFile,
    profilePictureFile,
    userId: encodedUserId,
    metadata: sdkMetadata
  })

  return response
}
