import { useCallback, useState } from 'react'

import { User } from 'audius-client/src/common/models/User'
import { profilePage } from 'audius-client/src/utils/route'
import { View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'

import { Text } from 'app/components/core'
import { ProfilePicture } from 'app/components/user'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing, typography }) => ({
  receiver: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(4)
  },
  profilePicture: {
    width: 42,
    height: 42
  },
  receiverInfo: {
    marginLeft: spacing(2)
  },
  receiverNameContainer: {
    display: 'flex',
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
  textUnderline: {
    textDecorationLine: 'underline'
  }
}))

type ReceiverDetailsProps = {
  receiver: User
}

export const ReceiverDetails = ({ receiver }: ReceiverDetailsProps) => {
  const styles = useStyles()
  const navigation = useNavigation()
  const [isActiveName, setIsActiveName] = useState(false)
  const [isActiveHandle, setIsActiveHandle] = useState(false)

  const goToReceiverProfile = useCallback(() => {
    navigation.navigate({
      native: { screen: 'Profile', params: { handle: receiver.handle } },
      web: { route: profilePage(receiver.handle) }
    })
  }, [navigation, receiver])

  const handlePressInName = useCallback(() => {
    setIsActiveName(true)
  }, [])
  const handlePressOutName = useCallback(() => {
    setIsActiveName(false)
  }, [])

  const handlePressInHandle = useCallback(() => {
    setIsActiveHandle(true)
  }, [])
  const handlePressOutHandle = useCallback(() => {
    setIsActiveHandle(false)
  }, [])

  return (
    <View style={styles.receiver}>
      <TouchableOpacity onPress={goToReceiverProfile}>
        <ProfilePicture profile={receiver} style={styles.profilePicture} />
      </TouchableOpacity>
      <View style={styles.receiverInfo}>
        <Text
          style={
            isActiveName
              ? [styles.receiverNameContainer, styles.textUnderline]
              : styles.receiverNameContainer
          }
          onPress={goToReceiverProfile}
          onPressIn={handlePressInName}
          onPressOut={handlePressOutName}>
          <Text variant='h3' style={styles.receiverName}>
            {receiver.name}
          </Text>
          <UserBadges user={receiver} badgeSize={12} hideName />
        </Text>
        <Text
          variant='h4'
          style={
            isActiveHandle
              ? [styles.receiverHandle, styles.textUnderline]
              : styles.receiverHandle
          }
          onPress={goToReceiverProfile}
          onPressIn={handlePressInHandle}
          onPressOut={handlePressOutHandle}>
          @{receiver.handle}
        </Text>
      </View>
    </View>
  )
}
