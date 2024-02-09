import type { CompletionCheckProps } from '@audius/harmony/src/components/completion-check/types'
import styled, { css } from '@emotion/native'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withTiming
} from 'react-native-reanimated'

import { IconValidationCheck, IconValidationX } from 'app/harmony-native/icons'

import { Flex } from '../layout'

const CompletionIconBase = styled(Animated.View)({
  position: 'absolute',
  justifyContent: 'center',
  alignItems: 'center',
  height: 16,
  width: 16,
  borderRadius: 9999
})

const CompletionDefault = styled(CompletionIconBase)(({ theme }) => ({
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: theme.color.neutral.neutral
}))

const useIconAnimation = (
  value: CompletionCheckProps['value'],
  iconValue: CompletionCheckProps['value']
) => {
  const animationValue = useDerivedValue(() => {
    return withTiming(value === iconValue ? 1 : 0, {
      duration: 180,
      easing: Easing.inOut(Easing.ease)
    })
  })

  return useAnimatedStyle(() => {
    const scale = interpolate(animationValue.value, [0, 0.75, 1], [0, 1.2, 1])
    const opacity = interpolate(animationValue.value, [0, 1], [0.3, 1])
    const zIndex = interpolate(animationValue.value, [0, 1], [0, 2])

    return { zIndex, opacity, transform: [{ scale }] }
  })
}

const CompletionError = ({ value }: CompletionCheckProps) => {
  const animationStyle = useIconAnimation(value, 'error')

  return (
    <CompletionIconBase style={[animationStyle]}>
      <IconValidationX />
    </CompletionIconBase>
  )
}

const CompletionSuccess = ({ value }: CompletionCheckProps) => {
  const animationStyle = useIconAnimation(value, 'complete')

  return (
    <CompletionIconBase style={[animationStyle]}>
      <IconValidationCheck />
    </CompletionIconBase>
  )
}

export const CompletionCheck = (props: CompletionCheckProps) => {
  return (
    <Flex
      alignItems='center'
      style={css({
        position: 'relative',
        width: 16,
        height: 16
      })}
    >
      <CompletionDefault />
      <CompletionSuccess {...props} />
      <CompletionError {...props} />
    </Flex>
  )
}

export type { CompletionCheckProps }
