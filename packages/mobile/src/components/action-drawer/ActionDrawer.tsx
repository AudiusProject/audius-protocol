import { Modals  } from '@audius/common/store'
     import type { ReactNode } from 'react'
import { useCallback } from 'react'

import type { } from '@audius/common'
import type { TextStyle, ViewStyle } from 'react-native'
import { TouchableHighlight, View } from 'react-native'
import type { SetOptional } from 'type-fest'

import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import type { AppDrawerProps } from '../drawer/AppDrawer'
import { AppDrawer, useDrawerState } from '../drawer/AppDrawer'

export type ActionDrawerRow = {
  text: string
  icon?: ReactNode
  style?: TextStyle
  callback?: () => void
  isDestructive?: boolean
}

type ActionDrawerProps = {
  modalName: Modals
  rows: ActionDrawerRow[]
  styles?: { row?: ViewStyle }
  disableAutoClose?: boolean
} & SetOptional<AppDrawerProps, 'children'>

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
  row: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight8
  },
  title: {
    fontSize: typography.fontSize.medium
  },
  action: {
    fontSize: typography.fontSize.xl,
    paddingTop: spacing(1),
    color: palette.secondary
  },
  actionIcon: {
    minWidth: 42
  },
  destructiveAction: {
    color: palette.accentRed
  }
}))

// `ActionDrawer` is a drawer that presents a list of clickable rows with text
const ActionDrawer = (props: ActionDrawerProps) => {
  const {
    modalName,
    rows,
    styles: stylesProp,
    disableAutoClose,
    children,
    ...other
  } = props
  const styles = useStyles()
  const { onClose } = useDrawerState(modalName)

  const didSelectRow = useCallback(
    (index: number) => {
      const { callback } = rows[index]
      if (!disableAutoClose) {
        onClose()
      }
      if (callback) {
        callback()
      }
    },
    [rows, onClose, disableAutoClose]
  )

  const { neutralLight9 } = useThemeColors()

  return (
    <AppDrawer modalName={modalName} {...other}>
      <View>
        {children}
        {rows.map(({ text, isDestructive = false, icon, style }, index) => (
          <TouchableHighlight
            key={`${text}-${index}`}
            onPress={() => {
              didSelectRow(index)
            }}
            underlayColor={neutralLight9}
          >
            <View style={[styles.row, stylesProp?.row]}>
              {icon ? <View style={styles.actionIcon}>{icon}</View> : null}
              <Text
                fontSize='xl'
                weight='demiBold'
                color={isDestructive ? 'accentRed' : 'secondary'}
                style={style}
              >
                {text}
              </Text>
            </View>
          </TouchableHighlight>
        ))}
      </View>
    </AppDrawer>
  )
}

export default ActionDrawer
