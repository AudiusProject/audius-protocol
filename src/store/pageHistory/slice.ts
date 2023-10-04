import { LOCATION_CHANGE } from 'connected-react-router'
import { getPageTitleFromRoute } from '../../utils/routes'

export type State = {
  pageTitles: Array<string>
}

const initState = {
  pageTitles: []
}

export const reducer = (state: State = initState, action: any) => {
  if (action.type === LOCATION_CHANGE) {
    const title = getPageTitleFromRoute(action.payload.location.pathname)
    if (title && action.payload.action === 'POP') {
      const len = state.pageTitles.length
      if (len === 0) {
        state.pageTitles = [...state.pageTitles, title]
      } else {
        state.pageTitles = state.pageTitles.filter((_, idx) => idx !== len - 1)
      }
    } else if (title && action.payload.action === 'PUSH') {
      state.pageTitles = [...state.pageTitles, title]
    } else if (title && action.payload.action === 'REPLACE') {
      state.pageTitles = [...state.pageTitles]
      state.pageTitles[state.pageTitles.length - 1] = title
    }
  }
  return state
}

export default reducer
