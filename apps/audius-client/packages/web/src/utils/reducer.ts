import { Action } from 'redux'
import {
  useSelector as untypedUseSelector,
  TypedUseSelectorHook
} from 'react-redux'
import { AppState } from 'store/types'

// The TypedUseSelectorHook can't handle selectors created by reselect,
// as the OutputSelector and OutputParameterSelector take additional
// args beyond state: TState. Override the UserSelectorHook here to play ball.
interface UseSelectorHook<TState> extends TypedUseSelectorHook<TState> {
  <TSelected>(
    selector: (state: TState, ...args: any[]) => TSelected,
    equalityFn?: (left: TSelected, right: TSelected) => boolean
  ): TSelected
}

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
