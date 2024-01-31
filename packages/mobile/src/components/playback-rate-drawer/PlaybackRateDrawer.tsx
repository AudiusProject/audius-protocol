import { playerActions, PlaybackRate } from '@audius/common/store'
import { useCallback, useMemo } from 'react'

import type {} from '@audius/common'

import { useDispatch } from 'react-redux'

import ActionDrawer from '../action-drawer'
import type { ActionDrawerRow } from '../action-drawer/ActionDrawer'

const { setPlaybackRate } = playerActions

const messages = {
  drawerTitle: 'Playback Speed'
}

const rates: PlaybackRate[] = [
  '0.5x',
  '0.8x',
  '1x',
  '1.1x',
  '1.2x',
  '1.5x',
  '2x',
  '2.5x',
  '3x'
]

export const PlaybackRateDrawer = () => {
  const dispatch = useDispatch()

  const setRate = useCallback(
    (rate: PlaybackRate) => {
      dispatch(setPlaybackRate({ rate }))
    },
    [dispatch]
  )

  const rows: ActionDrawerRow[] = useMemo(
    () =>
      rates.map((rate) => ({
        text: rate,
        callback: () => setRate(rate)
      })),
    [setRate]
  )

  return (
    <ActionDrawer
      modalName='PlaybackRate'
      rows={rows}
      title={messages.drawerTitle}
    />
  )
}
