import { useCallback } from 'react'

import { tippingSelectors } from '@audius/common/store'
import { css } from '@emotion/native'
import { useTheme } from '@emotion/react'
import { Pressable } from 'react-native'
import { useSelector } from 'react-redux'

import { Flex, Text } from '@audius/harmony-native'
import { ProfilePicture } from 'app/components/core'
import { UserBadges } from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
const { getSendUser } = tippingSelectors

export const ReceiverDetails = () => {
  const receiver = useSelector(getSendUser)
  const { spacing } = useTheme()
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    if (!receiver) return
    navigation.getParent()?.goBack()
    navigation.navigate('Profile', { handle: receiver?.handle })
  }, [receiver, navigation])

  if (!receiver) return null

  const { name, handle } = receiver

  return (
    <Pressable onPress={handlePress}>
      <Flex row alignItems='center' alignSelf='center' gap='s' mb='l'>
        <ProfilePicture
          userId={receiver.user_id}
          style={css({ width: spacing.unit21, height: spacing.unit21 })}
        />
        <Flex gap='xs'>
          <Flex row alignItems='center' gap='xs'>
            <Text variant='heading' size='xs'>
              {name}
            </Text>
            <UserBadges userId={receiver.user_id} badgeSize='xs' />
          </Flex>
          <Text variant='body' size='s'>
            @{handle}
          </Text>
        </Flex>
      </Flex>
    </Pressable>
  )
}
