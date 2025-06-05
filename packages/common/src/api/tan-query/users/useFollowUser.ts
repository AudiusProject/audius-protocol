import { Id } from '@audius/sdk'
import { Action } from '@reduxjs/toolkit'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useQueryContext } from '~/api/tan-query/utils'
import { useAppContext } from '~/context/appContext'
import { Kind } from '~/models'
import { Name, FollowSource } from '~/models/Analytics'
import { Feature } from '~/models/ErrorReporting'
import { ID } from '~/models/Identifiers'
import { UserMetadata } from '~/models/User'
import { update } from '~/store/cache/actions'

import { useCurrentUserId } from './account/useCurrentUserId'
import { getUserQueryKey } from './useUser'

type FollowUserParams = {
  followeeUserId: ID | null | undefined
  source?: FollowSource
  onSuccessActions?: Action[]
}

type MutationContext = {
  previousUser: UserMetadata | undefined
}

export const useFollowUser = () => {
  const { audiusSdk, reportToSentry } = useQueryContext()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()
  const {
    analytics: { track, make }
  } = useAppContext()
  const dispatch = useDispatch()

  return useMutation({
    mutationFn: async ({
      followeeUserId,
      source,
      onSuccessActions
    }: FollowUserParams) => {
      if (
        !currentUserId ||
        !followeeUserId ||
        currentUserId === followeeUserId
      ) {
        return
      }

      const sdk = await audiusSdk()
      await sdk.users.followUser({
        userId: Id.parse(currentUserId),
        followeeUserId: Id.parse(followeeUserId)
      })

      if (onSuccessActions) {
        onSuccessActions.forEach((action) => dispatch(action))
      }

      if (source) {
        track(
          make({
            eventName: Name.FOLLOW,
            id: followeeUserId.toString(),
            source
          })
        )
      }
    },
    onMutate: async ({ followeeUserId }): Promise<MutationContext> => {
      if (!followeeUserId || !currentUserId) {
        return { previousUser: undefined }
      }

      await queryClient.cancelQueries({
        queryKey: getUserQueryKey(followeeUserId)
      })

      const previousUser = queryClient.getQueryData(
        getUserQueryKey(followeeUserId)
      )

      const followeeUpdate = {
        does_current_user_follow: true,
        follower_count: (previousUser?.follower_count ?? 0) + 1
      }

      if (previousUser) {
        const updatedUser = {
          ...previousUser,
          ...followeeUpdate
        }
        queryClient.setQueryData(getUserQueryKey(followeeUserId), updatedUser)
      }
      dispatch(
        update(Kind.USERS, [{ id: followeeUserId, metadata: followeeUpdate }])
      )

      const currentUser = queryClient.getQueryData(
        getUserQueryKey(currentUserId)
      )
      if (currentUser) {
        queryClient.setQueryData(getUserQueryKey(currentUserId), {
          ...currentUser,
          followee_count: (currentUser?.followee_count ?? 0) + 1
        })
      }

      return { previousUser }
    },
    onError: (
      error,
      { followeeUserId },
      context: MutationContext | undefined
    ) => {
      const { previousUser } = context ?? {}

      if (previousUser) {
        queryClient.setQueryData(getUserQueryKey(followeeUserId), previousUser)
      }

      reportToSentry({
        error,
        additionalInfo: {
          followeeUserId
        },
        feature: Feature.Social,
        name: 'Follow User'
      })
    }
  })
}
