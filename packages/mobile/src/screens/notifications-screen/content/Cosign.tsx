import {
  Entity as EntityType,
  RemixCosign
} from 'audius-client/src/common/store/notifications/types'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from 'app/utils/theme'

import Entity from './Entity'
import TwitterShare from './TwitterShare'
import User from './User'
import UserImages from './UserImages'

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8
  },
  textWrapper: {
    fontFamily: 'AvenirNextLTPro-Medium',
    fontSize: 16,
    marginLeft: 4
  }
})

type CosignProps = {
  notification: RemixCosign
}

const Cosign = ({ notification }: CosignProps) => {
  const textWrapperStyle = useTheme(styles.textWrapper, {
    color: 'neutral'
  })
  if (!notification.user) return null

  const user = notification.user
  const entity = notification.entities.find(
    (track) => track?.owner_id === notification.parentTrackUserId
  )

  return (
    <View>
      <View style={styles.container}>
        <UserImages notification={notification} users={[user]} />
        <Text style={textWrapperStyle}>
          <User user={user} />
          <Text>{` Co-signed your Remix of `}</Text>
          <Entity entity={entity} entityType={EntityType.Track} />
        </Text>
      </View>
      <TwitterShare notification={notification} />
    </View>
  )
}

export default Cosign
