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
    }
  }

  const baseStyles = {
    root: { flexDirection: 'row' },
    iconLeft: { marginRight: spacing(2) },
    iconRight: { marginLeft: spacing(2) },
    disabled: { color: palette.neutralLight4 }
  }

  return merge(baseStyles, variantStyles[variant])
})

type TextButtonProps = TouchableOpacityProps &
  ButtonProps & {
    variant: 'primary' | 'secondary'
    icon?: ComponentType<SvgProps>
    iconPosition?: 'left' | 'right'
  }

export const TextButton = (props: TextButtonProps) => {
  const {
    title,
    variant,
    icon: Icon,
    iconPosition,
    style,
    disabled,
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
      <Text color={variant} style={disabled && styles.disabled}>
        {title}
      </Text>
      {iconPosition === 'right' ? icon : null}
    </TouchableOpacity>
  )
}
