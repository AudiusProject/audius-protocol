import { useCallback, useMemo } from 'react'

import type { PlaybackRate } from '@audius/common'
import { playerActions } from '@audius/common'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import { makeStyles } from 'app/styles'

import ActionDrawer from '../action-drawer'
import type { ActionDrawerRow } from '../action-drawer/ActionDrawer'
import { Text } from '../core'

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

const useStyles = makeStyles(({ palette, spacing }) => ({
  title: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing(2),
    paddingBottom: spacing(4),
    borderBottomColor: palette.neutralLight8,
    borderBottomWidth: 1
  },
  titleText: {
    textTransform: 'uppercase'
  }
}))

export const PlaybackRateDrawer = () => {
  const dispatch = useDispatch()
  const styles = useStyles()
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
      renderTitle={() => (
        <View style={styles.title}>
          <Text
            weight='heavy'
            color='neutralLight2'
            fontSize='xl'
            style={styles.titleText}
          >
            {messages.drawerTitle}
          </Text>
        </View>
      )}
    />
  )
}
