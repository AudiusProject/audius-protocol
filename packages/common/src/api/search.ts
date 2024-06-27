import { createApi } from '~/audius-query'
import { ModalSource } from '~/models'
import { ID } from '~/models/Identifiers'
import { SearchKind } from '~/store'
import { Genre } from '~/utils'

export type SearchCategory = 'all' | 'tracks' | 'albums' | 'playlists' | 'users'

export type SearchFilters = {
  genre?: Genre
  mood?: ModalSource
  bpm?: string
  key?: string
  isVerified?: boolean
  hasDownloads?: boolean
  isPremium?: boolean
}

export type SearchFilter = keyof SearchFilters

type getSearchArgs = {
  currentUserId: ID | null
  query: string
  category?: SearchCategory
  limit?: number
  offset?: number
  includePurchaseable?: boolean
}

const searchApi = createApi({
  reducerPath: 'searchApi',
  endpoints: {
    getSearchResults: {
      fetch: async (args: getSearchArgs, { apiClient }) => {
        const { category, ...rest } = args
        const kind = category as SearchKind
        return await apiClient.getSearchFull({ kind, ...rest })
      },
      options: { schemaKey: 'root' }
    }
  }
})

export const { useGetSearchResults } = searchApi.hooks
export const searchApiReducer = searchApi.reducer
