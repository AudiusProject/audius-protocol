import dayjs from 'dayjs'

import { createApi } from '~/audius-query'
import {
  ID,
  ManagedUserMetadata,
  User,
  UserMetadata,
  managedUserListFromSDK,
  userManagerListFromSDK
} from '~/models'
import { reformatUser } from '~/store/cache/users/utils'

import { AudiusSdk } from '@audius/sdk'
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
  managedAccount: ManagedUserMetadata
}

const fetchManagers = async ({
  userId,
  audiusSdkInstance
}: {
  userId: number
  audiusSdkInstance: AudiusSdk
}) => {
  const managedUsers = await audiusSdkInstance.full.users.getManagers({
    id: Id.parse(userId)
  })

  const { data: rawData = [] } = managedUsers
  const data = rawData.filter((g) => g.grant.isApproved !== false)
  return userManagerListFromSDK(data)
}

const fetchManagedAccounts = async ({
  userId,
  audiusSdkInstance
}: {
  userId: number
  audiusSdkInstance: AudiusSdk
}) => {
  const managedUsers = await audiusSdkInstance.full.users.getManagedUsers({
    id: Id.parse(userId)
  })

  const { data = [] } = managedUsers
  return managedUserListFromSDK(data)
}

const accountApi = createApi({
  reducerPath: 'accountApi',
  endpoints: {
    getCurrentUserId: {
      async fetch(_, context) {
        const { audiusBackend } = context
        const account = await audiusBackend.getAccount()
        return account?.user_id || null
      },
      options: {
        type: 'query'
      }
    },
    getCurrentWeb3User: {
      async fetch(_, { audiusBackend }) {
        const libs = await audiusBackend.getAudiusLibsTyped()
        // TODO: https://linear.app/audius/issue/PAY-2838/separate-walletentropy-user-and-current-user-in-state
        // What happens in the cache if something here is null?

        // Note: This cast is mostly safe, but is missing info populated in AudiusBackend.getAccount()
        // Okay for now as that info isn't generally available on non-account users and isn't used in manager mode.
        return libs.Account?.getWeb3User() as UserMetadata | null
      },
      options: {
        type: 'query',
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
        return await fetchManagedAccounts({ userId, audiusSdkInstance: sdk })
      },
      options: {
        type: 'query',
        idArgKey: 'manager.user_id',
        schemaKey: 'managedUsers'
      }
    },
    getManagers: {
      async fetch({ userId }: { userId: ID }, { audiusSdk }) {
        const sdk = await audiusSdk()
        return await fetchManagers({ userId, audiusSdkInstance: sdk })
      },
      options: {
        type: 'query',
        idArgKey: 'user.user_id',
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
        idArgKey: 'managerUser.user_id',
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
                  // TODO(nkang - C-4332) - Fill this in
                  grantee_address: '',
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
        idArgKey: 'managerUserId',
        type: 'mutation',
        schemaKey: 'managedUsers'
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
                (m: { user: number } | { user: UserMetadata }) =>
                  typeof m.user === 'number'
                    ? m.user === userId
                    : m.user.user_id === userId
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
                (m: { manager: number } | { manager: UserMetadata }) => {
                  return typeof m.manager === 'number'
                    ? m.manager === userId
                    : m.manager.user_id === userId
                }
              )
              if (foundIndex != null && foundIndex > -1) {
                // @ts-expect-error (C-4330)
                state.userManagers.splice(foundIndex, 1)
              }
            }
          )
        )
      },
      async onQueryError(
        _error: unknown,
        { userId, managerUserId }: RemoveManagerPayload,
        { dispatch, audiusSdk, audiusBackend }
      ) {
        const sdk = await audiusSdk()
        const undoOptimisticManagersUpdate = async () => {
          // Refetch the optimistically removed manager and add it back to userManagers state
          try {
            const userManagers = await fetchManagers({
              userId,
              audiusSdkInstance: sdk
            })
            dispatch(
              accountApi.util.updateQueryData(
                'getManagers',
                { userId },
                (state) => {
                  const removedUserManager = userManagers.find(
                    (m) => m.manager.user_id === managerUserId
                  )
                  if (removedUserManager) {
                    // @ts-expect-error (C-4330)
                    state.userManagers.push({
                      grant: removedUserManager.grant,
                      manager: reformatUser(
                        removedUserManager.manager,
                        audiusBackend
                      )
                    })
                  }
                  return state
                }
              )
            )
          } catch {
            // Ignore errors
          }
        }
        const undoOptimisticManagedAccountsUpdate = async () => {
          // Refetch the optimistically removed managed account and add it back to managerUsers state
          try {
            const managedAccounts = await fetchManagedAccounts({
              userId: managerUserId,
              audiusSdkInstance: sdk
            })
            dispatch(
              accountApi.util.updateQueryData(
                'getManagedAccounts',
                { userId: managerUserId },
                (state) => {
                  const removedManagedUser = managedAccounts.find(
                    (m) => m.user.user_id === userId
                  )
                  if (removedManagedUser) {
                    // @ts-expect-error (C-4330)
                    state.managedUsers.push({
                      grant: removedManagedUser.grant,
                      user: reformatUser(removedManagedUser.user, audiusBackend)
                    })
                  }
                }
              )
            )
          } catch {
            // Ignore errors
          }
        }
        undoOptimisticManagersUpdate()
        undoOptimisticManagedAccountsUpdate()
      }
    },
    approveManagedAccount: {
      async fetch(payload: ApproveManagedAccountPayload, { audiusSdk }) {
        const { managedAccount, userId } = payload
        const grantorUserId = managedAccount.user.user_id
        const encodedUserId = Id.parse(userId) as string
        const encodedGrantorUserId = Id.parse(grantorUserId)
        const sdk = await audiusSdk()

        await sdk.grants.approveGrant({
          userId: encodedUserId,
          grantorUserId: encodedGrantorUserId
        })
      },
      options: {
        idArgKey: 'grantorUser.user_id',
        type: 'mutation'
      },
      async onQueryStarted(
        payload: ApproveManagedAccountPayload,
        { dispatch }
      ) {
        const { userId, managedAccount } = payload
        dispatch(
          accountApi.util.updateQueryData(
            'getManagedAccounts',
            { userId },
            (state) => {
              const currentTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
              // TODO(C-4330) - The state type is incorrect - fix.
              // @ts-expect-error
              const foundIndex = state.managedUsers?.findIndex(
                (m: { user: number } | { user: UserMetadata }) =>
                  typeof m.user === 'number'
                    ? m.user === managedAccount.user.user_id
                    : m.user.user_id === managedAccount.user.user_id
              )
              if (foundIndex != null && foundIndex > -1) {
                // @ts-expect-error
                state.managedUsers.splice(foundIndex, 1, {
                  grant: {
                    ...managedAccount.grant,
                    is_approved: true,
                    updated_at: currentTime
                  },
                  user: managedAccount.user
                })
              }
              return state
            }
          )
        )
      },
      async onQueryError(
        _error: unknown,
        payload: ApproveManagedAccountPayload,
        { dispatch }
      ) {
        const { userId, managedAccount } = payload
        dispatch(
          accountApi.util.updateQueryData(
            'getManagedAccounts',
            { userId },
            (state) => {
              // @ts-expect-error (C-4330)
              const foundIndex = state.managedUsers?.findIndex(
                (m: { user: number } | { user: UserMetadata }) =>
                  typeof m.user === 'number'
                    ? m.user === managedAccount.user.user_id
                    : m.user.user_id === managedAccount.user.user_id
              )
              if (foundIndex != null && foundIndex > -1) {
                // @ts-expect-error (C-4330)
                state.managedUsers.splice(foundIndex, 1, managedAccount)
              }
              return state
            }
          )
        )
      }
    }
  }
})

export const {
  useGetCurrentUserId,
  useGetCurrentWeb3User,
  useResetPassword,
  useGetManagedAccounts,
  useGetManagers,
  useRequestAddManager,
  useApproveManagedAccount,
  useRemoveManager
} = accountApi.hooks

export const accountApiReducer = accountApi.reducer
