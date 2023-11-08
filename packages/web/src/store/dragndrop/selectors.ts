import { AppState } from 'store/types'

export const selectDragnDropState = (state: AppState) => state.dragndrop

export const selectDraggingKind = (state: AppState) => state.dragndrop.kind
export const selectDraggingId = (state: AppState) => state.dragndrop.id
