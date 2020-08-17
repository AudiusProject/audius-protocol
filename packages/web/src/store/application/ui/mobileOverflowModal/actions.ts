import {
  OverflowAction,
  OverflowSource,
  OverflowActionCallbacks
} from './types'
import { ID } from 'models/common/Identifiers'

export const OPEN = 'OPEN' as 'OPEN'
export const CLOSE = 'CLOSE' as 'CLOSE'

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
