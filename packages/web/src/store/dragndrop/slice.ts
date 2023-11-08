import { ID, PlaylistLibraryKind } from '@audius/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type DragDropKind =
  | PlaylistLibraryKind
  | 'track'
  | 'album'
  | 'track'
  | 'album'
  | 'table-row'

export type DragnDropState = {
  dragging: boolean
  isOwner?: boolean
  kind?: DragDropKind
  id?: ID | string
  index?: number
}

type DragAction = PayloadAction<{
  kind: DragDropKind
  id: ID | string
  index?: number
  isOwner?: boolean
}>

const initialState: DragnDropState = {
  dragging: false
}

const slice = createSlice({
  name: 'dragndrop',
  initialState,
  reducers: {
    drag(state, action: DragAction) {
      const { kind, id, index, isOwner } = action.payload
      state.dragging = true
      state.kind = kind
      state.id = id
      state.index = index
      state.isOwner = isOwner
    },
    drop() {
      return { ...initialState }
    }
  }
})

export const { drag, drop } = slice.actions
export default slice.reducer
