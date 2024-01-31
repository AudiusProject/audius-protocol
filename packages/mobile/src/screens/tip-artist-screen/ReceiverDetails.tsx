import { useCallback } from 'react'

import { tippingSelectors } from '@audius/common/store'
import { Pressable, View } from 'react-native'
import { useSelector } from 'react-redux'

import { Text } from 'app/components/core'
import { ProfilePicture } from 'app/components/user'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
const { getSendUser } = tippingSelectors

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing(6)
  },
  receiverInfo: {
    marginLeft: spacing(2)
  }
}))

export const ReceiverDetails = () => {
  const receiver = useSelector(getSendUser)
  const styles = useStyles()
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    if (!receiver) return
    navigation.getParent()?.goBack()
    navigation.navigate('Profile', { handle: receiver?.handle })
  }, [receiver, navigation])

  if (!receiver) return null

  const { name, handle } = receiver

  return (
    <Pressable style={styles.root} onPress={handlePress}>
      <ProfilePicture profile={receiver} />
      <View style={styles.receiverInfo}>
        <Text variant='h3'>
          {name}
          <UserBadges user={receiver} hideName />
        </Text>
        <Text variant='h4'>@{handle}</Text>
      </View>
    </Pressable>
  )
}
