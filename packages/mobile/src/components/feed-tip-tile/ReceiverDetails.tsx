import { useCallback } from 'react'

import type { User } from '@audius/common'
import { View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'

import { Text, ProfilePicture } from 'app/components/core'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import { PressableText } from './PressableText'

const useStyles = makeStyles(({ spacing, typography }) => ({
  receiver: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(4)
  },
  receiverInfo: {
    marginLeft: spacing(2)
  },
  receiverNameContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  receiverName: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontByWeight.bold
  },
  receiverHandle: {
    marginTop: spacing(1),
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontByWeight.demiBold
  },
  pressed: {
    opacity: 0.2
  }
}))

type ReceiverDetailsProps = {
  receiver: User
}

export const ReceiverDetails = ({ receiver }: ReceiverDetailsProps) => {
  const styles = useStyles()
  const navigation = useNavigation()

  const goToReceiverProfile = useCallback(() => {
    navigation.navigate('Profile', { handle: receiver.handle })
  }, [navigation, receiver])

  return (
    <View style={styles.receiver}>
      <TouchableOpacity onPress={goToReceiverProfile}>
        <ProfilePicture userId={receiver.user_id} size='medium' />
      </TouchableOpacity>
      <View style={styles.receiverInfo}>
        <PressableText onPress={goToReceiverProfile}>
          {({ pressed }) => (
            <Text
              style={[styles.receiverNameContainer, pressed && styles.pressed]}
            >
              <Text variant='h3' style={styles.receiverName}>
                {receiver.name}
              </Text>
              <UserBadges user={receiver} badgeSize={12} hideName />
            </Text>
          )}
        </PressableText>
        <PressableText onPress={goToReceiverProfile}>
          {({ pressed }) => (
            <Text
              variant='h4'
              style={[styles.receiverHandle, pressed && styles.pressed]}
            >
              @{receiver.handle}
            </Text>
          )}
        </PressableText>
      </View>
    </View>
  )
}
