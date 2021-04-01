import { AppState } from 'src/store'
import { CastStatus } from './actions'

const getBaseState = (state: AppState) => state.googleCast

export const getGoogleCastStatus = (state: AppState) =>
  getBaseState(state).status
export const getIsGoogleCastConnected = (state: AppState) =>
  getBaseState(state).status === CastStatus.Connected

export const getCastStartPosition = (state: AppState) =>
  getBaseState(state).startPosition
