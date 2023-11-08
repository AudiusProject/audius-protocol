import { CommonState } from '../../commonStore'

export const makeGetReactionForSignature =
  (signature: string) => (state: CommonState) =>
    state.ui.reactions.reactionsForEntityMap[signature]
