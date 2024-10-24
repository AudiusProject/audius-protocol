import { useMemo } from 'react'

import dayjs from 'dayjs'

import { managedUserListFromSDK, userManagerListFromSDK } from '~/adapters/user'
import { createApi } from '~/audius-query'
import { ID, User, UserMetadata } from '~/models'

import { userApiFetch } from './user'
import { Id } from './utils'

type ResetPasswordArgs = {
  email: string
  password: string
}

type RequestAddManagerPayload = {
  userId: number
  managerUser: UserMetadata | User
}

type RemoveManagerPayload = {
  userId: number
  managerUserId: number
}

type ApproveManagedAccountPayload = {
  userId: number
  grantorUser: UserMetadata | User
}

const accountApi = createApi({
  reducerPath: 'accountApi',
  endpoints: {
    // TODO-NOW: These are going to double-request the same user and store it under a different key.
    // Would be helpful to consolidate
    getCurrentUser: {
      async fetch(_, context) {
        const { accountWalletAddress: wallet } =
          await context.getWalletAddresses()

        if (!wallet) {
          console.warn('No wallet found for current user')
          return null
        }
        const account = await userApiFetch.getUserAccount({ wallet }, context)
        return account?.user
      },
      options: {
        // TODO-NOW: Only doing this to avoid double caching of user
        // Decide if that's necessary (also applies to getCurrentWeb3User)
        schemaKey: 'currentUser'
      }
    },
    getCurrentWeb3User: {
      async fetch(_, context) {
        const { web3WalletAddress: wallet } = await context.getWalletAddresses()

        if (!wallet) {
          console.warn('No wallet found for current user')
          return null
        }
        const account = await userApiFetch.getUserAccount({ wallet }, context)
        return account?.user
      },
      // TODO-NOW: Can this go away? Or at least be structured such that the user itself gets cached?
      options: {
        // Note that this schema key is used to prevent caching of the
        // web3 user as it does not match the standard user schema.
        schemaKey: 'currentWeb3User'
      }
    },
    resetPassword: {
      async fetch(args: ResetPasswordArgs, context) {
        const { email, password } = args
        const { audiusBackend } = context

        await audiusBackend.resetPassword(email, password)
        return { status: 'ok' }
      },
      options: {
        type: 'mutation'
      }
    },
    getManagedAccounts: {
      async fetch({ userId }: { userId: ID }, { audiusSdk }) {
        const sdk = await audiusSdk()
        const managedUsers = await sdk.full.users.getManagedUsers({
          id: Id.parse(userId)
        })

        const { data = [] } = managedUsers
        return managedUserListFromSDK(data)
      },
      options: {
        schemaKey: 'managedUsers'
      }
    },
    getManagers: {
      async fetch({ userId }: { userId: ID }, { audiusSdk }) {
        const sdk = await audiusSdk()
        const managedUsers = await sdk.full.users.getManagers({
          id: Id.parse(userId)
        })

        const { data: rawData = [] } = managedUsers
        const data = rawData.filter((g) => g.grant.isApproved !== false)
        return userManagerListFromSDK(data)
      },
      options: {
        schemaKey: 'userManagers'
      }
    },
    requestAddManager: {
      async fetch(payload: RequestAddManagerPayload, { audiusSdk }) {
        const { managerUser, userId } = payload
        const managerUserId = managerUser.user_id
        const encodedUserId = Id.parse(userId) as string
        const encodedManagerUserId = Id.parse(managerUserId)
        const sdk = await audiusSdk()

        await sdk.grants.addManager({
          userId: encodedUserId,
          managerUserId: encodedManagerUserId
        })

        return payload
      },
      options: {
        type: 'mutation',
        schemaKey: 'userManagers'
      },
      async onQuerySuccess(
        _res,
        payload: RequestAddManagerPayload,
        { dispatch }
      ) {
        const { userId, managerUser } = payload
        dispatch(
          accountApi.util.updateQueryData(
            'getManagers',
            { userId },
            (state) => {
              const currentTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
              // TODO(C-4330) - The state type is incorrect - fix.
              // @ts-expect-error
              state.userManagers.push({
                grant: {
                  created_at: currentTime,
                  grantee_address: managerUser.erc_wallet ?? managerUser.wallet,
                  is_approved: null,
                  is_revoked: false,
                  updated_at: currentTime,
                  user_id: userId
                },
                manager: managerUser
              })
            }
          )
        )
      }
    },
    removeManager: {
      async fetch(payload: RemoveManagerPayload, { audiusSdk }) {
        const { managerUserId, userId } = payload
        const encodedUserId = Id.parse(userId) as string
        const encodedManagerUserId = Id.parse(managerUserId)
        const sdk = await audiusSdk()

        await sdk.grants.removeManager({
          userId: encodedUserId,
          managerUserId: encodedManagerUserId
        })

        return payload
      },
      options: {
        type: 'mutation',
        schemaKey: 'userManagers'
      },
      async onQueryStarted(payload: RemoveManagerPayload, { dispatch }) {
        const { managerUserId, userId } = payload
        dispatch(
          accountApi.util.updateQueryData(
            'getManagedAccounts',
            { userId: managerUserId },
            (state) => {
              // TODO(C-4330) - The state type is incorrect - fix.
              // @ts-expect-error
              const foundIndex = state.managedUsers?.findIndex(
                (m: { user: number }) => m.user === userId
              )
              if (foundIndex != null && foundIndex > -1) {
                // @ts-expect-error (C-4330)
                state.managedUsers.splice(foundIndex, 1)
              }
            }
          )
        )
        dispatch(
          accountApi.util.updateQueryData(
            'getManagers',
            { userId },
            (state) => {
              // TODO(C-4330) - The state type is incorrect - fix.
              // @ts-expect-error
              const foundIndex = state.userManagers?.findIndex(
                (m: { manager: number }) => {
                  return m.manager === managerUserId
                }
              )
              if (foundIndex != null && foundIndex > -1) {
                // @ts-expect-error (C-4330)
                state.userManagers.splice(foundIndex, 1)
              }
            }
          )
        )
      }
    },
    approveManagedAccount: {
      async fetch(payload: ApproveManagedAccountPayload, { audiusSdk }) {
        const { grantorUser, userId } = payload
        const grantorUserId = grantorUser.user_id
        const encodedUserId = Id.parse(userId) as string
        const encodedGrantorUserId = Id.parse(grantorUserId)
        const sdk = await audiusSdk()

        await sdk.grants.approveGrant({
          userId: encodedUserId,
          grantorUserId: encodedGrantorUserId
        })

        return payload
      },
      options: {
        type: 'mutation'
      },
      async onQueryStarted(
        payload: ApproveManagedAccountPayload,
        { dispatch }
      ) {
        const { userId, grantorUser } = payload
        dispatch(
          accountApi.util.updateQueryData(
            'getManagedAccounts',
            { userId },
            (state) => {
              // TODO(C-4330) - The state type is incorrect - fix.
              // @ts-expect-error
              const foundIndex = state.managedUsers.findIndex(
                (m: { user: number }) => m.user === grantorUser.user_id
              )
              // @ts-expect-error
              state.managedUsers[foundIndex].grant.is_approved = true
            }
          )
        )
      }
    }
  }
})

export const useGetCurrentUserId = (
  ...args: Parameters<typeof accountApi.hooks.useGetCurrentUser>
) => {
  const result = accountApi.hooks.useGetCurrentUser(...args)
  return useMemo(() => {
    return { ...result, data: result.data ? result.data.user_id : null }
  }, [result])
}

export const {
  useGetCurrentUser,
  useGetCurrentWeb3User,
  useResetPassword,
  useGetManagedAccounts,
  useGetManagers,
  useRequestAddManager,
  useApproveManagedAccount,
  useRemoveManager
} = accountApi.hooks

export const accountApiReducer = accountApi.reducer
export const accountApiFetchSaga = accountApi.fetchSaga
