import { AppState } from 'store/types'

export const getShowCookieBanner = (state: AppState) => {
  return state.application.ui.cookieBanner.show
}
