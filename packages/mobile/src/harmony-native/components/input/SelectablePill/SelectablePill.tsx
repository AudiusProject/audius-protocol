import { useState } from 'react'

import { useTheme } from '@audius/harmony'
import styled from '@emotion/native'
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming
} from 'react-native-reanimated'
import type { ViewStyle } from 'react-native/types'

import { Flex } from '../../layout'

import type { SelectablePillProps } from './types'

const Root = styled(Animated.View)<SelectablePillProps>(
  ({ theme, size, disabled }) => ({
    borderRadius: theme.cornerRadius['2xl'],
    alignSelf: 'flex-start',
    opacity: disabled ? 0.45 : 1,
    ...(size === 'large' && theme.shadows.near)
  })
)

const PillRoot = styled.Pressable<SelectablePillProps>(
  ({ theme, size = 'small', isSelected = false }) => {
    const selectedCss: ViewStyle = {
      borderColor: theme.color.secondary.s400,
      borderStyle: 'solid',
      borderWidth: 1,

      ...(size === 'large' && {
        elevation: 0,
        shadowRadius: 0,
        shadowOffset: { width: 0, height: 0 }
      })
    }

    const rootCss: ViewStyle = {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      alignSelf: 'flex-start',
      borderColor: theme.color.border.strong,
      borderStyle: 'solid',
      borderWidth: 1,
      borderRadius: theme.cornerRadius['2xl'],
      ...(size === 'small' && {
        height: theme.spacing.xl,
        paddingHorizontal: theme.spacing.m
      }),
      ...(size === 'large' && {
        height: theme.spacing['2xl'],
        paddingHorizontal: theme.spacing.l
      }),
      ...(isSelected && selectedCss)
    }

    return rootCss
  }
)

export const SelectablePill = (props: SelectablePillProps) => {
  const { icon: Icon } = props
  const [isPressing, setIsPressing] = useState(false)
  const { color } = useTheme()

  const selectValue = useDerivedValue(() => {
    return withTiming(isPressing || props.isSelected ? 1 : 0, {
      duration: 120,
      easing: Easing.bezier(0.44, 0, 0.56, 1)
    })
  })
  const pressValue = useDerivedValue(() => {
    return withTiming(isPressing ? 1 : 0, {
      duration: 120,
      easing: Easing.bezier(0.44, 0, 0.56, 1)
    })
  })

  const rootStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      selectValue.value,
      [0, 1],
      [color.background.white, color.secondary.s400]
    )

    const scale = interpolate(pressValue.value, [0, 1], [1, 0.97])

    return {
      backgroundColor,
      transform: [{ scale }]
    }
  })

  const textStyle = useAnimatedStyle(() => {
    const textColor = interpolateColor(
      selectValue.value,
      [0, 1],
      [color.text.default, color.static.white]
    )

    return {
      color: textColor
    }
  })

  return (
    <Root style={[rootStyle]} {...props}>
      <PillRoot
        onPressIn={() => setIsPressing(true)}
        onPressOut={() => setIsPressing(false)}
        {...props}
      >
        <Flex direction='row' gap='xs' alignItems='center'>
          {Icon ? (
            <Icon
              size='xs'
              fill={
                props.isSelected || isPressing
                  ? color.text.staticWhite
                  : color.text.default
              }
            />
          ) : null}
          <Animated.Text numberOfLines={1} style={[textStyle]}>
            {props.label}
          </Animated.Text>
        </Flex>
      </PillRoot>
    </Root>
  )
}
