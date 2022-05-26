import { getSendUser } from 'audius-client/src/common/store/tipping/selectors'
import { View } from 'react-native'

import { Text } from 'app/components/core'
import { ProfilePicture } from 'app/components/user'
import UserBadges from 'app/components/user-badges'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

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
  const receiver = useSelectorWeb(getSendUser)
  const styles = useStyles()
  if (!receiver) return null

  const { name, handle } = receiver

  return (
    <View style={styles.root}>
      <ProfilePicture profile={receiver} />
      <View style={styles.receiverInfo}>
        <Text variant='h3'>
          {name}
          <UserBadges user={receiver} hideName />
        </Text>
        <Text variant='h4'>@{handle}</Text>
      </View>
    </View>
  )
}
