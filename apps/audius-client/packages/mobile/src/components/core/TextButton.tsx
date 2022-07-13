import { ComponentType } from 'react'

import { merge } from 'lodash'
import {
  ButtonProps,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle
} from 'react-native'
import { SvgProps } from 'react-native-svg'

import { Text } from 'app/components/core'
import { makeStyles, StylesProp } from 'app/styles'

import { TextProps } from './Text'

const useStyles = makeStyles(({ palette, spacing }, { variant }) => {
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
    neutralLight4: {
      icon: {
        fill: palette.neutralLight4
      }
    }
  }

  const baseStyles = {
    root: { flexDirection: 'row', alignItems: 'center' },
    iconLeft: { marginRight: spacing(1) },
    iconRight: { marginLeft: spacing(1) },
    disabled: { color: palette.neutralLight7 }
  }

  return merge(baseStyles, variantStyles[variant])
})

export type TextButtonProps = TouchableOpacityProps &
  ButtonProps & {
    variant: 'primary' | 'secondary' | 'neutralLight4'
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
    title,
    variant,
    icon: Icon,
    iconPosition,
    style,
    disabled,
    showDisabled = true,
    TextProps,
    IconProps,
    styles: stylesProp,
    ...other
  } = props
  const styles = useStyles({ variant })

  const showDisabledColor = disabled && showDisabled

  const icon = Icon ? (
    <Icon
      height={18}
      width={18}
      fill={showDisabledColor ? styles.disabled.color : styles.icon.fill}
      style={[
        iconPosition === 'left' ? styles.iconLeft : styles.iconRight,
        stylesProp?.icon
      ]}
      {...IconProps}
    />
  ) : null

  return (
    <TouchableOpacity
      style={[styles.root, stylesProp?.root, style]}
      disabled={disabled}
      {...other}>
      {iconPosition === 'left' ? icon : null}
      <Text
        color={variant}
        style={[stylesProp?.text, showDisabledColor && styles.disabled]}
        {...TextProps}>
        {title}
      </Text>
      {iconPosition === 'right' ? icon : null}
    </TouchableOpacity>
  )
}
