import type { ComponentType } from 'react'
import { useState, useCallback, useMemo } from 'react'

import { merge } from 'lodash'
import type {
  ButtonProps,
  GestureResponderEvent,
  TextStyle,
  TouchableOpacityProps,
  ViewStyle
} from 'react-native'
import { TouchableOpacity } from 'react-native'
import type { SvgProps } from 'react-native-svg'

import { Text } from 'app/components/core'
import type { StylesProp } from 'app/styles'
import { makeStyles } from 'app/styles'

import type { TextProps } from './Text'

const useStyles = makeStyles<Pick<TextButtonProps, 'variant'>>(
  // @ts-ignore need support for IconStyles in NamedStyles<T>
  ({ palette, spacing }, { variant }) => {
    const variantStyles = {
      primary: {
        icon: {
          fill: palette.primary
        }
      },
      secondary: {
        icon: {
          fill: palette.secondary
        }
      },
      neutral: {
        icon: {
          fill: palette.neutral
        }
      },
      neutralLight4: {
        icon: {
          fill: palette.neutralLight4
        }
      }
    }

    const baseStyles = {
      root: { flexDirection: 'row' as const, alignItems: 'center' as const },
      iconLeft: { marginRight: spacing(1) },
      iconRight: { marginLeft: spacing(1) },
      disabled: { color: palette.neutralLight7 },
      activeUnderline: { textDecorationLine: 'underline' }
    }

    return merge(baseStyles, variantStyles[variant])
  }
)

export type TextButtonProps = TouchableOpacityProps &
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

  const styleConfig = useMemo(() => ({ variant }), [variant])
  const styles = useStyles(styleConfig)
  const [isPressing, setIsPressing] = useState(false)

  const showDisabledColor = disabled && showDisabled

  const icon = Icon ? (
    <Icon
      height={18}
      width={18}
      // @ts-ignored currently restricted to react-native style interfaces
      fill={showDisabledColor ? styles.disabled.color : styles.icon.fill}
      style={[
        iconPosition === 'left' ? styles.iconLeft : styles.iconRight,
        stylesProp?.icon
      ]}
      {...IconProps}
    />
  ) : null

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      setIsPressing(true)
      onPressIn?.(event)
    },
    [onPressIn]
  )

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      setIsPressing(false)
      onPressOut?.(event)
    },
    [onPressOut]
  )

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
