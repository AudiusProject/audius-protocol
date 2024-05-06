import { createApi } from '~/audius-query'
import {
  ID,
  UserMetadata,
  managedUserListFromSDK,
  userManagerListFromSDK
} from '~/models'

import { Id } from './utils'

type ResetPasswordArgs = {
  email: string
  password: string
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
        const managedUsers = await sdk.full.users.getManagedUsers({
          id: Id.parse(userId)
        })

        const { data = [] } = managedUsers
        return managedUserListFromSDK(data)
      },
      options: {
        type: 'query',
        schemaKey: 'managedUsers'
      }
    },
    getManagers: {
      async fetch({ userId }: { userId: ID }, { audiusSdk }) {
        const sdk = await audiusSdk()
        const managedUsers = await sdk.full.users.getManagers({
          id: Id.parse(userId)
        })

        const { data = [] } = managedUsers
        return userManagerListFromSDK(data)
      },
      options: {
        type: 'query',
        schemaKey: 'userManagers'
      }
    }
  }
})

export const {
  useGetCurrentUserId,
  useGetCurrentWeb3User,
  useResetPassword,
  useGetManagedAccounts
} = accountApi.hooks

export const accountApiReducer = accountApi.reducer
