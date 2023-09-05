import type { ReactNode } from 'react'

import type { Modals } from '@audius/common'
import type { TextStyle, ViewStyle } from 'react-native'
import { StyleSheet, TouchableHighlight, View } from 'react-native'

import Text from 'app/components/text'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import type { ThemeColors } from 'app/utils/theme'
import { Theme, useThemeColors, useThemeVariant } from 'app/utils/theme'

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
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingTop: 16,
      paddingBottom: 16
    },

    row: {
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: themeColors.neutralLight8
    },

    title: {
      fontSize: 16
    },

    action: {
      fontSize: 21,
      paddingTop: 4,
      color: themeColors.actionSheetText
    },

    actionIcon: {
      minWidth: 42,
      display: 'flex'
    },

    destructiveAction: {
      color: themeColors.accentRed
    }
  })

// `ActionDrawer` is a drawer that presents a list of clickable rows with text
const ActionDrawer = ({
  modalName,
  rows,
  title,
  renderTitle,
  styles: stylesProp = {}
}: ActionSheetModalProps) => {
  const { onClose } = useDrawerState(modalName)

  const didSelectRow = (index: number) => {
    const { callback } = rows[index]
    onClose()
    if (callback) {
      callback()
    }
  }
  const styles = useThemedStyles(createStyles)

  const themeVariant = useThemeVariant()
  const isDarkMode = themeVariant === Theme.DARK
  const { neutralLight9, staticWhite } = useThemeColors()

  return (
    <AppDrawer modalName={modalName}>
      <View style={styles.container}>
        {renderTitle
          ? renderTitle()
          : title && <Text style={[styles.row, styles.title]}>{title}</Text>}
        {rows.map(({ text, isDestructive = false, icon, style }, index) => (
          <TouchableHighlight
            key={`${text}-${index}`}
            onPress={() => {
              didSelectRow(index)
            }}
            underlayColor={neutralLight9}
          >
            <View style={[styles.row, stylesProp.row]}>
              {icon ? <View style={styles.actionIcon}>{icon}</View> : null}
              <Text
                style={[
                  styles.action,
                  isDestructive ? styles.destructiveAction : {},
                  isDarkMode ? { color: staticWhite } : {},
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
