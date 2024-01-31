import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Nullable } from '../../../utils/typeUtils'

import { ReactionTypes } from './types'

export type ReactionsState = {
  reactionsForEntityMap: { [entityId: string]: Nullable<ReactionTypes> }
}

const initialState: ReactionsState = {
  reactionsForEntityMap: {}
}

const slice = createSlice({
  name: 'REACTIONS',
  initialState,
  reducers: {
    setLocalReactionValues: (
      state,
      action: PayloadAction<{
        reactions: Array<{
          reaction: Nullable<ReactionTypes>
          entityId: string
        }>
      }>
    ) => {
      const { reactions } = action.payload
      reactions.forEach(({ reaction, entityId }) => {
        state.reactionsForEntityMap[entityId] = reaction
      })
    },

    // Saga triggers

    writeReactionValue: (
      _state,
      _action: PayloadAction<{
        reaction: Nullable<ReactionTypes>
        entityId: string
      }>
    ) => {},
    fetchReactionValues: (
      _state,
      _action: PayloadAction<{ entityIds: string[] }>
    ) => {}
  }
})

export const {
  setLocalReactionValues,
  writeReactionValue,
  fetchReactionValues
} = slice.actions

export const actions = slice.actions
export default slice.reducer
