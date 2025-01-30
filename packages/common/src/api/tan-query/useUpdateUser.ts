import { AudiusSdk, OptionalId } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { userMetadataToSdk } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { PlaylistLibrary } from '~/models/PlaylistLibrary'
import { UserMetadata } from '~/models/User'

import { QUERY_KEYS } from './queryKeys'
import { getUserQueryKey } from './useUser'
import { getUserByHandleQueryKey } from './useUserByHandle'

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
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.user, userId] })
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.userByHandle] })
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.accountUser] })
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.track] })
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.collection] })

      // Snapshot the previous values
      const previousUser = queryClient.getQueryData<UserMetadata>([
        QUERY_KEYS.user,
        userId
      ])

      // Snapshot the previous account user if it matches
      const previousAccountUser = queryClient
        .getQueriesData<UserMetadata>({
          queryKey: [QUERY_KEYS.accountUser]
        })
        .find(([_, data]) => data?.user_id === userId)?.[1]

      // Optimistically update user
      queryClient.setQueryData(getUserQueryKey(userId), (old: any) => ({
        ...old,
        ...metadata
      }))

      // Optimistically update userByHandle queries if they match the user
      queryClient.setQueryData(
        getUserByHandleQueryKey(metadata.handle),
        (old: any) => ({ ...old, ...metadata })
      )

      // Optimistically update accountUser queries if they match the user
      queryClient.setQueriesData(
        { queryKey: [QUERY_KEYS.accountUser] },
        (oldData: any) => {
          if (!oldData?.user_id || oldData.user_id !== userId) return oldData
          return { ...oldData, ...metadata }
        }
      )

      // Optimistically update all tracks that contain this user
      queryClient.setQueriesData(
        { queryKey: [QUERY_KEYS.track] },
        (oldData: any) => {
          if (!oldData?.user || oldData.user.id !== userId) return oldData
          return {
            ...oldData,
            user: {
              ...oldData.user,
              ...metadata
            }
          }
        }
      )

      // Optimistically update all collections
      queryClient.setQueriesData(
        { queryKey: [QUERY_KEYS.collection] },
        (oldData: any) => {
          if (!oldData) return oldData

          let updatedData = oldData

          // Update collection if the user is the owner
          if (oldData.user?.id === userId) {
            updatedData = {
              ...oldData,
              user: {
                ...oldData.user,
                ...metadata
              }
            }
          }

          // Update collection if the user appears in any of the tracks
          if (oldData.tracks?.some((track: any) => track.user?.id === userId)) {
            updatedData = {
              ...updatedData,
              tracks: oldData.tracks.map((track: any) =>
                track.user?.id === userId
                  ? {
                      ...track,
                      user: {
                        ...track.user,
                        ...metadata
                      }
                    }
                  : track
              )
            }
          }

          return updatedData
        }
      )

      // Return context with the previous user
      return { previousUser, previousAccountUser }
    },
    onError: (_err, { userId }, context?: MutationContext) => {
      // If the mutation fails, roll back user data
      if (context?.previousUser) {
        queryClient.setQueryData(getUserQueryKey(userId), context.previousUser)

        // Roll back userByHandle queries
        queryClient.setQueryData(
          getUserByHandleQueryKey(context.previousUser?.handle),
          context.previousUser
        )
      }

      // Roll back accountUser queries if we have the previous state
      if (context?.previousAccountUser) {
        queryClient.setQueriesData(
          { queryKey: [QUERY_KEYS.accountUser] },
          (oldData: any) => {
            if (!oldData?.user_id || oldData.user_id !== userId) return oldData
            return context.previousAccountUser
          }
        )
      }

      // Roll back all tracks that contain this user
      queryClient.setQueriesData(
        { queryKey: [QUERY_KEYS.track] },
        (oldData: any) => {
          if (!oldData?.user || oldData.user.id !== userId) return oldData
          return {
            ...oldData,
            user: context?.previousUser
          }
        }
      )

      // Roll back all collections
      queryClient.setQueriesData(
        { queryKey: [QUERY_KEYS.collection] },
        (oldData: any) => {
          if (!oldData) return oldData

          let updatedData = oldData

          // Roll back collection if the user is the owner
          if (oldData.user?.id === userId) {
            updatedData = {
              ...oldData,
              user: context?.previousUser
            }
          }

          // Roll back collection if the user appears in any of the tracks
          if (oldData.tracks?.some((track: any) => track.user?.id === userId)) {
            updatedData = {
              ...updatedData,
              tracks: oldData.tracks.map((track: any) =>
                track.user?.id === userId
                  ? {
                      ...track,
                      user: context?.previousUser
                    }
                  : track
              )
            }
          }

          return updatedData
        }
      )
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
