import { Id } from '@audius/sdk'
import { Action } from '@reduxjs/toolkit'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { useAppContext } from '~/context/appContext'
import { Name, FollowSource } from '~/models/Analytics'
import { Feature } from '~/models/ErrorReporting'
import { ID } from '~/models/Identifiers'
import { UserMetadata } from '~/models/User'

import { useCurrentUserId } from '..'

import { QUERY_KEYS } from './queryKeys'
import { getUserQueryKey } from './useUser'
import { getUserByHandleQueryKey } from './useUserByHandle'
import { primeUserData } from './utils/primeUserData'

type FollowUserParams = {
  followeeUserId: ID | null | undefined
  source?: FollowSource
  onSuccessActions?: Action[]
}

type MutationContext = {
  previousUser: UserMetadata | undefined
  previousAccountUser: UserMetadata | undefined
}

export const useFollowUser = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()
  const {
    analytics: { track, make }
  } = useAppContext()
  const dispatch = useDispatch()

  return useMutation<void, Error, FollowUserParams, MutationContext>({
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
      await queryClient.cancelQueries({
        queryKey: [QUERY_KEYS.user, followeeUserId]
      })

      const previousUser = queryClient.getQueryData<UserMetadata>([
        QUERY_KEYS.user,
        followeeUserId
      ])

      if (previousUser) {
        const updatedUser = {
          ...previousUser,
          does_current_user_follow: true,
          follower_count: previousUser.follower_count + 1
        }
        primeUserData({
          users: [updatedUser],
          queryClient,
          dispatch,
          forceReplace: true
        })
      }

      const previousAccountUser = queryClient.getQueryData<UserMetadata>([
        QUERY_KEYS.accountUser
      ])

      if (previousAccountUser) {
        queryClient.setQueryData([QUERY_KEYS.accountUser], {
          ...previousAccountUser,
          followee_count: previousAccountUser.followee_count + 1
        })
      }

      return { previousUser, previousAccountUser }
    },
    onError: (
      error,
      { followeeUserId },
      context: MutationContext | undefined
    ) => {
      const { previousUser, previousAccountUser } = context ?? {}

      if (previousUser) {
        queryClient.setQueryData(getUserQueryKey(followeeUserId), previousUser)

        if (previousUser.handle) {
          queryClient.setQueryData(
            getUserByHandleQueryKey(previousUser.handle),
            previousUser
          )
        }
      }

      if (previousAccountUser) {
        queryClient.setQueryData([QUERY_KEYS.accountUser], previousAccountUser)
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
