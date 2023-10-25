import { createApi } from '@audius/common'

const signUpApi = createApi({
  reducerPath: 'signUpApi',
  endpoints: {
    emailInUse: {
      fetch: async (email, { audiusBackend }) => {
        return await audiusBackend.emailInUse(email)
      },
      options: {
        type: 'mutation'
      }
    }
  }
})

export const { useEmailInUse } = signUpApi.hooks
export const signUpReducer = signUpApi.reducer
