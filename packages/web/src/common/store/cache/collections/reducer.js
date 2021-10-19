import { initialCacheState } from 'common/store/cache/reducer'

const initialState = {
  ...initialCacheState
}

const reducer = (state = initialState, action) => state

export default reducer
