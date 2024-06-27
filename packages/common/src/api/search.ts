import { createApi } from '~/audius-query'
import { ModalSource } from '~/models'
import { ID } from '~/models/Identifiers'
import { SearchKind } from '~/store/pages/search-results/types'
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
