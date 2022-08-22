import { createCustomAction } from 'typesafe-actions'

export const SET_REACHABLE = 'REACHABILITY/SET_REACHABLE'
export const SET_UNREACHABLE = 'REACHABILITY/SET_UNREACHABLE'

export const setReachable = createCustomAction(SET_REACHABLE, () => ({}))
export const setUnreachable = createCustomAction(SET_UNREACHABLE, () => ({}))
