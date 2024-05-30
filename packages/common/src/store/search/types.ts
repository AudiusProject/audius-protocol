import { PayloadAction } from '@reduxjs/toolkit'

import { ID, Kind } from '~/models'
import { Nullable } from '~/utils/typeUtils'

export type SectionHeader = 'users' | 'tracks' | 'playlists' | 'albums'

export type SearchItem = {
  kind: Kind
  id: ID
}

// TODO: Can remove this once SearchV2 has been fully rolled out
export type SearchItemBackwardsCompatible = string | SearchItem

export type SearchState = {
  history: SearchItemBackwardsCompatible[]
}

export type SetSearchHistoryAction = PayloadAction<{
  searchHistory: SearchItemBackwardsCompatible[]
}>

export type AddSearchHistoryItemAction = PayloadAction<{
  searchItem: Nullable<SearchItemBackwardsCompatible>
}>

export type RemoveSearchHistoryItemAction = PayloadAction<{
  searchItem: SearchItemBackwardsCompatible
}>
