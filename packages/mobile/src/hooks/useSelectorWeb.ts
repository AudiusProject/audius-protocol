import { isEmpty } from 'lodash'
import { Selector, useSelector } from 'react-redux'

import { CommonState } from 'audius-client/src/common/store'

// When mobile client is no longer dependent on the web client
// calls to useSelectorWeb can be replaced with useSelector
export const useSelectorWeb = <ReturnValue>(
  selector: Selector<CommonState, ReturnValue>
) => {
  return useSelector((state: { clientStore: CommonState }) =>
    isEmpty(state.clientStore) ? undefined : selector(state.clientStore)
  )
}
