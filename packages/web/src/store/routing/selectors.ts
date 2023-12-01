import { AppState } from 'store/types'
import { getPathname } from 'utils/route'

export const getLocation = (state: AppState) => state.router.location

export const getLocationPathname = (state: AppState) =>
  getPathname(state.router.location)
