import { Nullable } from '@audius/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { CommonState } from 'common/store'

export type ReactionTypes = 'heart' | 'fire' | 'party' | 'explode'

// The order these reactions appear in the web + mobile UI
export const reactionOrder: ReactionTypes[] = [
  'heart',
  'fire',
  'party',
  'explode'
]

export const reactionsMap: { [k in ReactionTypes]: number } = {
  heart: 1,
  fire: 2,
  party: 3,
  explode: 4
}

export const getReactionFromRawValue = (value: number) => {
  const val = (Object.entries(reactionsMap) as [ReactionTypes, number][]).find(
    ([k, v]) => v === value
  )
  return val?.[0] ?? null
}

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
      state,
      action: PayloadAction<{
        reaction: Nullable<ReactionTypes>
        entityId: string
      }>
    ) => {},
    fetchReactionValues: (
      state,
      action: PayloadAction<{ entityIds: string[] }>
    ) => {}
  }
})

export const makeGetReactionForSignature =
  (signature: string) => (state: CommonState) =>
    state.ui.reactions.reactionsForEntityMap[signature]

export const {
  setLocalReactionValues,
  writeReactionValue,
  fetchReactionValues
} = slice.actions

export default slice.reducer
