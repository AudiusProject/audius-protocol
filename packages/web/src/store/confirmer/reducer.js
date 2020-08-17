import {
  ADD_CONFIRMATION_CALL,
  SET_CONFIRMATION_RESULT,
  ADD_COMPLETION_CALL,
  CLEAR
} from 'store/confirmer/actions'

export const initialState = {
  // id -> {index, [{call: function, result: null}]}
  confirm: {},
  // id -> success/fail calls
  complete: {}
}

const actionsMap = {
  [ADD_CONFIRMATION_CALL](state, action) {
    const newConfirm = { ...state.confirm }
    if (action.uid in state.confirm) {
      newConfirm[action.uid] = {
        ...state.confirm[action.uid],
        calls: [
          ...state.confirm[action.uid].calls,
          { call: action.confirmationCall, result: null }
        ]
      }
    } else {
      newConfirm[action.uid] = {
        index: 0,
        calls: [{ call: action.confirmationCall, result: null }]
      }
    }

    return {
      ...state,
      confirm: newConfirm
    }
  },
  [SET_CONFIRMATION_RESULT](state, action) {
    const newConfirm = { ...state.confirm }

    const newCalls = state.confirm[action.uid].calls
    newCalls[state.confirm[action.uid].index].result = action.result
    newConfirm[action.uid].index = state.confirm[action.uid].index + 1

    return {
      ...state,
      confirm: newConfirm
    }
  },
  [ADD_COMPLETION_CALL](state, action) {
    const newComplete = { ...state.complete }
    if (action.uid in newComplete) {
      newComplete[action.uid].push(action.completionCall)
    } else {
      newComplete[action.uid] = [action.completionCall]
    }

    return {
      ...state,
      complete: newComplete
    }
  },
  [CLEAR](state, action) {
    const newConfirm = { ...state.confirm }
    const newComplete = { ...state.newComplete }

    delete newConfirm[action.uid]
    delete newComplete[action.uid]

    return {
      ...state,
      confirm: newConfirm,
      complete: newComplete
    }
  }
}

export default function confirmer(state = initialState, action) {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}
