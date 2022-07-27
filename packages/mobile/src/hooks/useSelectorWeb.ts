import type { CommonState } from 'audius-client/src/common/store'
import { isEqual as lodashIsEqual } from 'lodash'
import type { Selector } from 'react-redux'
import { useSelector } from 'react-redux'

export const isEqual: <T>(left: T, right: T) => boolean = lodashIsEqual

// When mobile client is no longer dependent on the web client
// calls to useSelectorWeb can be replaced with useSelector
export const useSelectorWeb = <ReturnValue>(
  selector: Selector<CommonState, ReturnValue>,
  equalityFn?: (left: ReturnValue, right: ReturnValue) => boolean
) => {
  return useSelector(
    (state: { common: CommonState }) => selector(state.common),
    equalityFn
  )
}
