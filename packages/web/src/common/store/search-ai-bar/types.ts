import { Status, SearchUser } from '@audius/common/models'
import {} from '@audius/common'

export type SearchResults = {
  users: SearchUser[]
}

export type SearchAiBarState = SearchResults & {
  searchText: string
  status: Status
  disregardResponses: boolean
}
