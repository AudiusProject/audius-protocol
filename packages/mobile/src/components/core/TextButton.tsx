import type { ComponentType } from 'react'
import { useState, useCallback } from 'react'

import { TouchableOpacity } from 'react-native'
import type {
  ButtonProps,
  TextStyle,
  TouchableOpacityProps,
  ViewStyle
} from 'react-native'
import type { GenericTouchableProps } from 'react-native-gesture-handler/lib/typescript/components/touchables/GenericTouchable'
import type { SvgProps } from 'react-native-svg'

import { Text } from 'app/components/core'
import type { StylesProp } from 'app/styles'
import { makeStyles } from 'app/styles'
import { useThemePalette } from 'app/utils/theme'

import type { TextProps } from './Text'

const useStyles = makeStyles(({ palette, spacing }) => ({
  root: { flexDirection: 'row' as const, alignItems: 'center' as const },
  iconLeft: { marginRight: spacing(1) },
  iconRight: { marginLeft: spacing(1) },
  disabled: { color: palette.neutralLight7 },
  activeUnderline: { textDecorationLine: 'underline' }
}))

export type TextButtonProps = TouchableOpacityProps &
  GenericTouchableProps &
  ButtonProps & {
    activeUnderline?: boolean
    variant: 'primary' | 'secondary' | 'neutral' | 'neutralLight4'
    icon?: ComponentType<SvgProps>
    iconPosition?: 'left' | 'right'
    TextProps?: Partial<TextProps>
    IconProps?: Partial<SvgProps>
    styles?: StylesProp<{ root: ViewStyle; icon: ViewStyle; text: TextStyle }>
    // If `true` visually grey out text-button
    showDisabled?: boolean
  }

export const TextButton = (props: TextButtonProps) => {
  const {
    activeUnderline,
    title,
    variant,
    icon: Icon,
    iconPosition = 'left',
    style,
    disabled,
    showDisabled = true,
    TextProps,
    IconProps,
    styles: stylesProp,
    onPressIn,
    onPressOut,
    ...other
  } = props

  const styles = useStyles()
  const palette = useThemePalette()
  const [isPressing, setIsPressing] = useState(false)

  const showDisabledColor = disabled && showDisabled

  const icon = Icon ? (
    <Icon
      height={18}
      width={18}
      // @ts-ignored currently restricted to react-native style interfaces
      fill={showDisabledColor ? styles.disabled.color : palette[variant]}
      style={[
        iconPosition === 'left' ? styles.iconLeft : styles.iconRight,
        stylesProp?.icon
      ]}
      {...IconProps}
    />
  ) : null

  const handlePressIn = useCallback(() => {
    setIsPressing(true)
    onPressIn?.()
  }, [onPressIn])

  const handlePressOut = useCallback(() => {
    setIsPressing(false)
    onPressOut?.()
  }, [onPressOut])

  return (
    <TouchableOpacity
      style={[styles.root, stylesProp?.root, style]}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...other}
    >
      {iconPosition === 'left' ? icon : null}
      <Text
        color={variant}
        style={[
          stylesProp?.text,
          showDisabledColor && styles.disabled,
          activeUnderline && isPressing && styles.activeUnderline
        ]}
        {...TextProps}
      >
        {title}
      </Text>
      {iconPosition === 'right' ? icon : null}
    </TouchableOpacity>
  )
}
