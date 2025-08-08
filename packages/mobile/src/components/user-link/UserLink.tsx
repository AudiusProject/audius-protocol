import { useUser } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import type { StyleProp, TextStyle } from 'react-native'
import { Pressable } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

import type { IconSize, TextLinkProps } from '@audius/harmony-native'
import { Flex, TextLink, useTheme } from '@audius/harmony-native'
import type { AppTabScreenParamList } from 'app/screens/app-screen'

import { UserBadges } from '../user-badges'

const AnimatedFlex = Animated.createAnimatedComponent(Flex)

type ParamList = Pick<AppTabScreenParamList, 'Profile'>

type UserLinkProps = Omit<TextLinkProps<ParamList>, 'to' | 'children'> & {
  userId: ID
  badgeSize?: IconSize
  textLinkStyle?: StyleProp<TextStyle>
}

export const UserLink = (props: UserLinkProps) => {
  const { userId, badgeSize = 's', style, textLinkStyle, ...other } = props
  const { data: userName } = useUser(userId, {
    select: (user) => user?.name
  })

  const { motion } = useTheme()
  const animatedPressed = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(animatedPressed.value, [0, 1], [1, 0.5])
    }
  })

  return (
    <Pressable
      onPressIn={(e) => {
        animatedPressed.value = withTiming(1, motion.press)
      }}
      onPressOut={() => {
        animatedPressed.value = withTiming(0, motion.press)
      }}
    >
      <AnimatedFlex
        row
        gap='xs'
        alignItems='center'
        style={[animatedStyle, style]}
      >
        <TextLink
          to={{ screen: 'Profile', params: { id: userId } }}
          numberOfLines={1}
          flexShrink={1}
          animatedPressed={animatedPressed}
          style={textLinkStyle}
          {...other}
        >
          {userName}
        </TextLink>
        <UserBadges userId={userId} badgeSize={badgeSize} />
      </AnimatedFlex>
    </Pressable>
  )
}
