import { ID } from 'common/models/Identifiers'

import {
  OverflowAction,
  OverflowSource,
  OverflowActionCallbacks
} from './types'

export const OPEN = 'OPEN' as const
export const CLOSE = 'CLOSE' as const

export const open = (
  source: OverflowSource,
  id: ID | string,
  overflowActions: OverflowAction[],
  overflowActionCallbacks?: OverflowActionCallbacks
) => ({
  type: OPEN,
  source,
  id,
  overflowActions,
  overflowActionCallbacks
})

export const close = () => ({
  type: CLOSE
})

export type MobileOverflowModalActions =
  | ReturnType<typeof open>
  | ReturnType<typeof close>
