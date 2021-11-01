import React from 'react'
import { TouchableHighlight, ViewStyle, StyleSheet } from 'react-native'
import { useThemeColors } from '../../utils/theme'
import Text from '../../components/text'

import { ThemeColors, useThemedStyles } from '../../hooks/useThemedStyles'

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    button: {
      backgroundColor: themeColors.primary,
      borderRadius: 4,
      display: 'flex',
      alignItems: 'center',
      padding: 16
    },
    text: {
      color: themeColors.staticWhite,
      fontSize: 16
    }
  })

type ButtonProps = {
  onPress: () => void
  title: string
  style?: ViewStyle
}

const Button = ({ style, onPress, title }: ButtonProps) => {
  const styles = useThemedStyles(createStyles)
  const { primaryDark1 } = useThemeColors()
  return (
    <TouchableHighlight
      style={[styles.button, style]}
      onPress={onPress}
      underlayColor={primaryDark1}
    >
      <Text style={styles.text} weight='bold'>
        {title}
      </Text>
    </TouchableHighlight>
  )
}

export default Button
