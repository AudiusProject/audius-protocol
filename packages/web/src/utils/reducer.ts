import { useSelector as untypedUseSelector } from 'react-redux'
import { Action } from 'redux'

import { UseSelectorHook } from 'common/hooks/useSelector'
import { AppState } from 'store/types'

/**
 * Typed version of Redux useSelector
 */
export const useSelector: UseSelectorHook<AppState> = untypedUseSelector

/**
 * Handy util for generating a reducer function from an actionmap.
 *
 * @template A the Action type this reducer listens for
 * @template S the state type this reducer operates on
 */
export const makeReducer = <A extends Action, S>(
  actionsMap: { [action: string]: (state: S, action: A) => S },
  initialState: S
) => {
  return (state = initialState, action: A) => {
    const matchingReduceFunction = actionsMap[action.type]
    if (!matchingReduceFunction) return state
    return matchingReduceFunction(state, action)
  }
}

// TODO: Improve this typing from action: any
export type ActionsMap<S> = { [index: string]: (state: S, action: any) => S }
