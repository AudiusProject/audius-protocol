import { initialCacheState } from 'store/cache/reducer'

const initialState = {
  ...initialCacheState
}

const reducer = (state = initialState, _action: any) => state

export default reducer
