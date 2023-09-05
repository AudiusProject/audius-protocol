import type { CommonState } from '@audius/common'

export const RECEIVE = 'COMMON/RECEIVE'

type ReceiveAction = {
  type: typeof RECEIVE
  payload: Partial<CommonState>
}

export const receive = (commonState: Partial<CommonState>): ReceiveAction => ({
  type: RECEIVE,
  payload: commonState
})

export type CommonActions = ReceiveAction
