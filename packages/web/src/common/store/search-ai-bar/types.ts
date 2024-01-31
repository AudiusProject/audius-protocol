import { Status, SearchUser } from '@audius/common/models'

export type SearchResults = {
  users: SearchUser[]
}

export type SearchAiBarState = SearchResults & {
  searchText: string
  status: Status
  disregardResponses: boolean
}
