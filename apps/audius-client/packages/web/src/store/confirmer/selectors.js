// Confirmer selectors

// Check whether anything is confirming so UI can block reloads.
export const getIsConfirming = state =>
  Object.keys(state.confirmer.confirm).length > 0

export const getResult = (state, props) =>
  props.uid in state.confirmer.confirm && props.index > -1
    ? state.confirmer.confirm[props.uid].calls[props.index].result
    : {}
export const getIndexEquals = (state, props) =>
  props.uid in state.confirmer.confirm
    ? state.confirmer.confirm[props.uid].index === props.index
    : false
export const getConfirmLength = (state, props) =>
  props.uid in state.confirmer.confirm
    ? state.confirmer.confirm[props.uid].calls.length
    : 0
export const getIsDone = (state, props) =>
  props.uid in state.confirmer.confirm
    ? state.confirmer.confirm[props.uid].calls
        .map(call => call.result)
        .every(result => result !== null)
    : true
export const getCommandChain = (state, props) =>
  props.uid in state.confirmer.complete
    ? state.confirmer.complete[props.uid]
    : []

export const getConfirmCalls = state => state.confirmer.confirm
