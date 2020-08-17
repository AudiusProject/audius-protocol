import { AppState } from 'store/types'

export const getLocationPathname = (state: AppState) =>
  state.router.location.pathname
