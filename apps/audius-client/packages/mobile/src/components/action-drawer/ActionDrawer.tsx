import type { ReactNode } from 'react'
import { useCallback } from 'react'

import type { Modals } from '@audius/common'
import type { TextStyle, ViewStyle } from 'react-native'
import { TouchableHighlight, View } from 'react-native'

import Text from 'app/components/text'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { AppDrawer, useDrawerState } from '../drawer/AppDrawer'

export type ActionDrawerRow = {
  text: string
  icon?: ReactNode
  style?: TextStyle
  callback?: () => void
  isDestructive?: boolean
}

type ActionSheetModalProps = {
  modalName: Modals
  rows: ActionDrawerRow[]
  title?: string
  renderTitle?: () => React.ReactNode
  styles?: { row?: ViewStyle }
  disableAutoClose?: boolean
}

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
  container: {
    paddingVertical: spacing(4)
  },
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
const ActionDrawer = (props: ActionSheetModalProps) => {
  const {
    modalName,
    rows,
    title,
    renderTitle,
    styles: stylesProp,
    disableAutoClose
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
    <AppDrawer modalName={modalName}>
      <View style={styles.container}>
        {renderTitle ? (
          renderTitle()
        ) : title ? (
          <Text style={[styles.row, styles.title]}>{title}</Text>
        ) : null}
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
                style={[
                  styles.action,
                  isDestructive ? styles.destructiveAction : null,
                  style
                ]}
                weight='demiBold'
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
