import {
  CookieBannerAction,
  SHOW_COOKIE_BANNER,
  DISMISS_COOKIE_BANNER
} from 'store/application/ui/cookieBanner/actions'
import { makeReducer } from 'utils/reducer'

import { CookieBannerState } from './types'

const initialState: CookieBannerState = {
  show: false
}

const actionMap = {
  [SHOW_COOKIE_BANNER](
    state: CookieBannerState,
    action: CookieBannerAction
  ): CookieBannerState {
    return { show: true }
  },
  [DISMISS_COOKIE_BANNER](
    state: CookieBannerState,
    action: CookieBannerAction
  ): CookieBannerState {
    return { show: false }
  }
}

export default makeReducer(actionMap, initialState)
