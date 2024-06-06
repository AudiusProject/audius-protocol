import { createApi } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { SearchKind } from '~/store/pages/search-results/types'

type getSearchArgs = {
  currentUserId: ID | null
  query: string
  kind?: SearchKind
  limit?: number
  offset?: number
  includePurchaseable?: boolean
}

const searchApi = createApi({
  reducerPath: 'searchApi',
  endpoints: {
    getSearchFull: {
      fetch: async (args: getSearchArgs, { apiClient }) =>
        await apiClient.getSearchFull(args),
      options: {}
    }
  }
})

export const { useGetSearchFull } = searchApi.hooks
export const searchApiReducer = searchApi.reducer
