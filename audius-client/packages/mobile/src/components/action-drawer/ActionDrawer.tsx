import React from 'react'

import { StyleSheet, TouchableHighlight, View } from 'react-native'

import Drawer from 'app/components/drawer'
import Text from 'app/components/text'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import {
  Theme,
  ThemeColors,
  useThemeColors,
  useThemeVariant
} from 'app/utils/theme'

export type ActionDrawerRow = {
  text: string
  callback?: () => void
  isDestructive?: boolean
}

type ActionSheetModalProps = {
  rows: ActionDrawerRow[]
  isOpen: boolean
  onClose: () => void
  title?: string
  renderTitle?: () => React.ReactNode
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

    destructiveAction: {
      color: themeColors.accentRed
    }
  })

// `ActionDrawer` is a drawer that presents a list of clickable rows with text
const ActionDrawer = ({
  rows,
  isOpen,
  onClose,
  title,
  renderTitle
}: ActionSheetModalProps) => {
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
    <Drawer onClose={onClose} isOpen={isOpen}>
      <View style={styles.container}>
        {renderTitle
          ? renderTitle()
          : title && <Text style={[styles.row, styles.title]}>{title}</Text>}
        {rows.map(({ text, isDestructive = false }, index) => (
          <TouchableHighlight
            key={`${text}-${index}`}
            onPress={() => {
              didSelectRow(index)
            }}
            underlayColor={neutralLight9}
          >
            <View style={styles.row}>
              <Text
                style={[
                  styles.action,
                  isDestructive ? styles.destructiveAction : {},
                  isDarkMode ? { color: staticWhite } : {}
                ]}
                weight='demiBold'
              >
                {text}
              </Text>
            </View>
          </TouchableHighlight>
        ))}
      </View>
    </Drawer>
  )
}

export default ActionDrawer
