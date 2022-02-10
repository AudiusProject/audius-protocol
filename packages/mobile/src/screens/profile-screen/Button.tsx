import { ComponentType, useCallback, useState } from 'react'

import { merge } from 'lodash'
import {
  Pressable,
  Text,
  ButtonProps as RNButtonProps,
  Animated,
  PressableProps,
  ViewStyle
} from 'react-native'
import { SvgProps } from 'react-native-svg'

import { useColorAnimation } from 'app/hooks/usePressColorAnimation'
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import { makeStyles, StylesProp } from 'app/styles'
import { GestureResponderHandler } from 'app/types/gesture'
import { useThemeColors } from 'app/utils/theme'

const useStyles = makeStyles(
  ({ typography, palette, spacing }, { variant, isPressing }) => {
    const variantStyles = {
      primary: {
        root: {
          backgroundColor: palette.primary,
          borderWidth: 0
        },
        text: {
          color: palette.white
        },
        leftIcon: {
          color: palette.white
        }
      },
      secondary: {
        root: {
          borderColor: palette.primaryDark1,
          borderWidth: 1,
          backgroundColor: palette.white
        },
        text: {
          color: palette.primary
        },
        leftIcon: {
          color: palette.primary
        }
      },
      common: {
        root: {
          borderColor: palette.neutral,
          borderWidth: 1,
          backgroundColor: palette.white
        },
        text: {
          color: palette.neutral
        },
        leftIcon: {
          color: palette.neutral
        }
      }
    }

    const variantPressingStyles = {
      secondary: variantStyles.primary,
      common: variantStyles.primary
    }

    const baseStyles = {
      root: {
        borderRadius: 4,
        height: spacing(8),
        paddingHorizontal: spacing(2),
        justifyContent: 'center',
        alignItems: 'center'
      },
      button: {
        flexDirection: 'row',
        alignItems: 'center'
      },
      text: {
        fontSize: 11,
        fontFamily: typography.fontByWeight.bold,
        textTransform: 'uppercase'
      },
      leftIcon: {
        marginRight: spacing(1)
      }
    }

    return merge(
      baseStyles,
      variantStyles[variant],
      isPressing && variantPressingStyles[variant]
    )
  }
)

type ButtonProps = RNButtonProps &
  PressableProps & {
    iconLeft?: ComponentType<SvgProps>
    variant: 'primary' | 'secondary' | 'common'
    noText?: boolean
    styles?: StylesProp<{
      root: ViewStyle
      icon: ViewStyle
    }>
    IconProps?: SvgProps
  }

export const Button = (props: ButtonProps) => {
  const {
    title,
    iconLeft: IconLeft,
    variant,
    onPressIn,
    onPressOut,
    noText,
    style,
    styles: stylesProp,
    IconProps,
    ...other
  } = props

  const [isPressing, setIsPressing] = useState(false)
  const styles = useStyles({ variant, isPressing })
  const {
    scale,
    handlePressIn: handlePressInScale,
    handlePressOut: handlePressOutScale
  } = usePressScaleAnimation(0.97, false)

  const { primaryDark1 } = useThemeColors()

  const {
    color,
    handlePressIn: handlePressInColor,
    handlePressOut: handlePressOutColor
  } = useColorAnimation(styles.root.backgroundColor, primaryDark1)

  const handlePressIn: GestureResponderHandler = useCallback(
    event => {
      onPressIn?.(event)
      setIsPressing(true)
      handlePressInScale()
      handlePressInColor()
    },
    [onPressIn, handlePressInScale, handlePressInColor]
  )

  const handlePressOut: GestureResponderHandler = useCallback(
    event => {
      onPressOut?.(event)
      setIsPressing(false)
      handlePressOutScale()
      handlePressOutColor()
    },
    [onPressOut, handlePressOutScale, handlePressOutColor]
  )

  return (
    <Animated.View
      style={[
        styles.root,
        { transform: [{ scale }], backgroundColor: color },
        style,
        stylesProp?.root
      ]}
    >
      <Pressable
        style={styles.button}
        accessibilityRole='button'
        accessibilityLabel={noText ? title : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...other}
      >
        {IconLeft ? (
          <IconLeft
            style={[
              styles.leftIcon,
              stylesProp?.icon,
              noText && { marginRight: 0 }
            ]}
            fill={styles.leftIcon.color}
            height={20}
            width={20}
            {...IconProps}
          />
        ) : null}
        {noText ? null : <Text style={styles.text}>{title}</Text>}
      </Pressable>
    </Animated.View>
  )
}
