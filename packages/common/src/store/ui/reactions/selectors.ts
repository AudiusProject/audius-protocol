import { CommonState } from '~/store/reducers'

export const makeGetReactionForSignature =
  (signature: string) => (state: CommonState) =>
    state.ui.reactions.reactionsForEntityMap[signature]

export const selectors = { makeGetReactionForSignature }
