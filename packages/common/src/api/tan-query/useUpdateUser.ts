import { User } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAppContext } from '~/context'

import { QUERY_KEYS } from './queryKeys'

type UpdateUserMetadata = {
  name?: string
  bio?: string
  location?: string
  artistPickTrackId?: string
  isDeactivated?: boolean
  twitterHandle?: string
  instagramHandle?: string
  tiktokHandle?: string
  website?: string
}

type UpdateUserParams = {
  userId: string
  metadata: UpdateUserMetadata
  profilePictureFile?: File
  coverArtFile?: File
}

type MutationContext = {
  previousUser: any
}

export const useUpdateUser = () => {
  const { audiusSdk } = useAppContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      metadata,
      profilePictureFile,
      coverArtFile
    }: UpdateUserParams) => {
      if (!audiusSdk) throw new Error('SDK not initialized')

      const response = await audiusSdk.users.updateProfile({
        userId,
        metadata,
        profilePictureFile,
        coverArtFile
      })

      return response
    },
    onMutate: async ({ userId, metadata }): Promise<MutationContext> => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.user, userId] })
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.track] })
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.collection] })

      // Snapshot the previous values
      const previousUser = queryClient.getQueryData<User>([
        QUERY_KEYS.user,
        userId
      ])

      // Optimistically update user
      queryClient.setQueryData([QUERY_KEYS.user, userId], (old: any) => ({
        ...old,
        ...metadata
      }))

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
      return { previousUser }
    },
    onError: (_err, { userId }, context?: MutationContext) => {
      // If the mutation fails, roll back user data
      if (context?.previousUser) {
        queryClient.setQueryData(
          [QUERY_KEYS.user, userId],
          context.previousUser
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
