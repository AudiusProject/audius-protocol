import { createApi } from 'audius-query'

const signUpApi = createApi({
  reducerPath: 'signUpApi',
  endpoints: {
    isEmailInUse: {
      fetch: async ({ email }, { audiusBackend }) => {
        return await audiusBackend.emailInUse(email)
      },
      options: {}
    }
  }
})

export const { useIsEmailInUse } = signUpApi.hooks
export const signUpReducer = signUpApi.reducer
export const signUpFetch = signUpApi.fetch
