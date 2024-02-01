import { UserListStoreState } from '~/store/user-list/types'

import { ID } from '../../../models'

export type RelatedArtistsOwnState = {
  id: ID | null
}

export type RelatedArtistsPageState = {
  relatedArtistsPage: RelatedArtistsOwnState
  userList: UserListStoreState
}

export const RELATED_ARTISTS_USER_LIST_TAG = 'RELATED ARTISTS'
