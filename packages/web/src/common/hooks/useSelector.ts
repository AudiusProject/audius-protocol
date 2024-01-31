import { CommonState } from '@audius/common/store'
import {} from '@audius/common'
import {
  useSelector as untypedUseSelector,
  TypedUseSelectorHook
} from 'react-redux'

// The TypedUseSelectorHook can't handle selectors created by reselect,
// as the OutputSelector and OutputParameterSelector take additional
// args beyond state: TState. Override the UserSelectorHook here to play ball.
export interface UseSelectorHook<TState> extends TypedUseSelectorHook<TState> {
  <TSelected>(
    selector: (state: TState, ...args: any[]) => TSelected,
    equalityFn?: (left: TSelected, right: TSelected) => boolean
  ): TSelected
}

/**
 * Typed version of Redux useSelector
 */
export const useSelector: UseSelectorHook<CommonState> = untypedUseSelector
