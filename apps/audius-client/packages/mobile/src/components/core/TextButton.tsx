import { ComponentType } from 'react'

import { merge } from 'lodash'
import {
  ButtonProps,
  TouchableOpacity,
  TouchableOpacityProps
} from 'react-native'
import { SvgProps } from 'react-native-svg'

import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

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

type TextButtonProps = TouchableOpacityProps &
  ButtonProps & {
    variant: 'primary' | 'secondary' | 'neutralLight4'
    icon?: ComponentType<SvgProps>
    iconPosition?: 'left' | 'right'
    TextProps?: Partial<TextProps>
  }

export const TextButton = (props: TextButtonProps) => {
  const {
    title,
    variant,
    icon: Icon,
    iconPosition,
    style,
    disabled,
    TextProps,
    ...other
  } = props
  const styles = useStyles({ variant })

  const icon = Icon ? (
    <Icon
      height={18}
      width={18}
      fill={styles.icon.fill}
      style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
    />
  ) : null

  return (
    <TouchableOpacity
      style={[styles.root, style]}
      disabled={disabled}
      {...other}
    >
      {iconPosition === 'left' ? icon : null}
      <Text color={variant} style={disabled && styles.disabled} {...TextProps}>
        {title}
      </Text>
      {iconPosition === 'right' ? icon : null}
    </TouchableOpacity>
  )
}
