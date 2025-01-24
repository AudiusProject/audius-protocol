import { accountFromSDK } from '~/adapters/user'
import { createApi } from '~/audius-query'
import { isResponseError } from '~/utils'

const userApi = createApi({
  reducerPath: 'userApi',
  endpoints: {
    getUserAccount: {
      fetch: async ({ wallet }: { wallet: string }, { audiusSdk }) => {
        try {
          const sdk = await audiusSdk()
          const { data } = await sdk.full.users.getUserAccount({ wallet })
          if (!data) {
            console.warn('Missing user from account response')
            return null
          }

          return accountFromSDK(data)
        } catch (e) {
          // Account doesn't exist, don't bubble up an error, just return null
          if (isResponseError(e) && [401, 404].includes(e.response.status)) {
            return null
          }
          throw e
        }
      },
      options: {
        schemaKey: 'accountUser'
      }
    }
  }
})

export const { useGetUserAccount } = userApi.hooks
export const userApiReducer = userApi.reducer
export const userApiFetch = userApi.fetch
export const userApiFetchSaga = userApi.fetchSaga
export const userApiActions = userApi.actions
export const userApiUtils = userApi.util
