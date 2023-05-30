import { ID, Kind } from 'models'
import { createApi } from 'src/audius-query/createApi'

const userApi = createApi({
  reducerPath: 'userApi',
  endpoints: {
    getUserById: {
      fetch: async (
        { id, currentUserId }: { id: ID; currentUserId: ID },
        { apiClient }
      ) => {
        const apiUser = await apiClient.getUser({ userId: id, currentUserId })
        return apiUser?.[0]
      },
      options: {
        idArgKey: 'id',
        kind: Kind.USERS,
        schemaKey: 'user'
      }
    }
  }
})

export const { useGetUserById } = userApi.hooks
export const userApiReducer = userApi.reducer
