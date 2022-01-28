import { CommonState } from 'audius-client/src/common/store'
import { Selector, useSelector } from 'react-redux'

// When mobile client is no longer dependent on the web client
// calls to useSelectorWeb can be replaced with useSelector
export const useSelectorWeb = <ReturnValue>(
  selector: Selector<CommonState, ReturnValue>,
  equalityFn?: (left: ReturnValue, right: ReturnValue) => boolean
) => {
  return useSelector(
    (state: { clientStore: CommonState }) => selector(state.clientStore),
    equalityFn
  )
}
