import { createApi } from '~/audius-query'

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
      async fetch(_, context) {
        const sdk = await context.audiusSdk()
        const grants = await sdk.users.getUserGrants()
        return grants.data ?? []
      },
      options: {
        type: 'query'
      }
    }
  }
})

export const { useGetCurrentUserId, useResetPassword, useGetManagedAccounts } =
  accountApi.hooks

export const accountApiReducer = accountApi.reducer
