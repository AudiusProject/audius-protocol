import { createApi } from '~/audius-query'
import { Id } from './utils'
import { managedUserListFromSDK, userManagerListFromSDK } from '~/models'

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
      async fetch(_, { audiusSdk, audiusBackend }) {
        const sdk = await audiusSdk()
        // TODO: Look this up in a better way
        // https://linear.app/audius/issue/PAY-2816/look-up-parentchild-ids-from-a-better-place
        const currentUserId = (await audiusBackend.getAccount())?.user_id
        const managedUsers = await sdk.full.users.getManagedUsers({
          id: Id.parse(currentUserId)
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
      async fetch(_, { audiusSdk, audiusBackend }) {
        const sdk = await audiusSdk()
        // TODO: Look this up in a better way
        // https://linear.app/audius/issue/PAY-2816/look-up-parentchild-ids-from-a-better-place
        const currentUserId = (await audiusBackend.getAccount())?.user_id
        const managedUsers = await sdk.full.users.getManagers({
          id: Id.parse(currentUserId)
        })

        const { data = [] } = managedUsers
        return userManagerListFromSDK(data)
      },
      options: {
        type: 'query',
        schemaKey: 'managedUsers'
      }
    }
  }
})

export const { useGetCurrentUserId, useResetPassword, useGetManagedAccounts } =
  accountApi.hooks

export const accountApiReducer = accountApi.reducer
