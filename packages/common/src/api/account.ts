import { createApi } from 'audius-query'

type ResetPasswordArgs = {
  email: string
  password: string
}

const accountApi = createApi({
  reducerPath: 'accountApi',
  endpoints: {
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
    }
  }
})

export const { useResetPassword } = accountApi.hooks

export const accountApiReducer = accountApi.reducer
