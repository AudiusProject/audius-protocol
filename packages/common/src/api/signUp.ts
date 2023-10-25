import { createApi } from '@audius/common'

const signUpApi = createApi({
  reducerPath: 'signUpApi',
  endpoints: {
    isEmailInUse: {
      fetch: async ({ email }, { audiusBackend }) => {
        return await audiusBackend.emailInUse(email)
      },
      options: {
        type: 'mutation'
      }
    }
  }
})

export const { useIsEmailInUse } = signUpApi.hooks
export const signUpReducer = signUpApi.reducer
  