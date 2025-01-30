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
import { batchSetQueriesData, QueryKeyValue } from './utils/batchSetQueriesData'

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

      const updates: QueryKeyValue[] = [
        // User and handle updates
        {
          queryKey: getUserQueryKey(userId),
          data: { ...previousUser, ...metadata }
        },
        {
          queryKey: getUserByHandleQueryKey(metadata.handle),
          data: { ...previousUser, ...metadata }
        }
      ]

      // Add accountUser updates
      const accountUserQueries = queryClient.getQueriesData<UserMetadata>({
        queryKey: [QUERY_KEYS.accountUser]
      })
      accountUserQueries.forEach(([queryKey, data]) => {
        if (data?.user_id === userId) {
          updates.push({
            queryKey: [...queryKey],
            data: { ...data, ...metadata }
          })
        }
      })

      // Add track updates
      const trackQueries = queryClient.getQueriesData<any>({
        queryKey: [QUERY_KEYS.track]
      })
      trackQueries.forEach(([queryKey, data]) => {
        if (data?.user?.id === userId) {
          updates.push({
            queryKey: [...queryKey],
            data: {
              ...data,
              user: {
                ...data.user,
                ...metadata
              }
            }
          })
        }
      })

      // Add collection updates
      const collectionQueries = queryClient.getQueriesData<any>({
        queryKey: [QUERY_KEYS.collection]
      })
      collectionQueries.forEach(([queryKey, data]) => {
        if (!data) return

        let updatedData = data

        // Update collection if the user is the owner
        if (data.user?.id === userId) {
          updatedData = {
            ...updatedData,
            user: {
              ...data.user,
              ...metadata
            }
          }
        }

        // Update collection if the user appears in any of the tracks
        if (data.tracks?.some((track: any) => track.user?.id === userId)) {
          updatedData = {
            ...updatedData,
            tracks: data.tracks.map((track: any) =>
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

        if (updatedData !== data) {
          updates.push({
            queryKey: [...queryKey],
            data: updatedData
          })
        }
      })

      batchSetQueriesData(queryClient, updates)

      // Return context with the previous user
      return { previousUser, previousAccountUser }
    },
    onError: (_err, { userId }, context?: MutationContext) => {
      // If the mutation fails, roll back user data
      const updates: QueryKeyValue[] = []

      // Roll back user data
      if (context?.previousUser) {
        updates.push(
          {
            queryKey: getUserQueryKey(userId),
            data: context.previousUser
          },
          {
            queryKey: getUserByHandleQueryKey(context.previousUser.handle),
            data: context.previousUser
          }
        )
      }

      // Roll back accountUser queries if we have the previous state
      if (context?.previousAccountUser) {
        const accountUserQueries = queryClient.getQueriesData<any>({
          queryKey: [QUERY_KEYS.accountUser]
        })
        accountUserQueries.forEach(([queryKey, oldData]) => {
          if (!oldData?.user_id || oldData.user_id !== userId) return
          updates.push({
            queryKey: [...queryKey],
            data: context.previousAccountUser
          })
        })
      }

      // Roll back all tracks that contain this user
      const trackQueries = queryClient.getQueriesData<any>({
        queryKey: [QUERY_KEYS.track]
      })
      trackQueries.forEach(([queryKey, oldData]) => {
        if (!oldData?.user || oldData.user.id !== userId) return
        updates.push({
          queryKey: [...queryKey],
          data: {
            ...oldData,
            user: context?.previousUser
          }
        })
      })

      // Roll back all collections
      const collectionQueries = queryClient.getQueriesData<any>({
        queryKey: [QUERY_KEYS.collection]
      })
      collectionQueries.forEach(([queryKey, oldData]) => {
        if (!oldData) return

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

        if (updatedData !== oldData) {
          updates.push({
            queryKey: [...queryKey],
            data: updatedData
          })
        }
      })

      batchSetQueriesData(queryClient, updates)
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
