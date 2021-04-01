import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import {
  RemixCosign as CosignNotification,
  Entity as EntityType
} from '../../../store/notifications/types'
import UserImages from './UserImages'
import User from './User'
import Entity from './Entity'
import TwitterShare from './TwitterShare'
import { useTheme } from '../../../utils/theme'
import Track from 'models/Track'

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
  notification: CosignNotification
  onGoToRoute: (route: string) => void
}

const Cosign = ({ notification, onGoToRoute }: CosignProps) => {
  const user = notification.user
  const entity = notification.entities.find(
    (track: Track) => track.owner_id === notification.parentTrackUserId
  )

  const textWrapperStyle = useTheme(styles.textWrapper, {
    color: 'neutral'
  })

  return (
    <View>
      <View style={styles.container}>
        <UserImages
          notification={notification}
          users={[user]}
          onGoToRoute={onGoToRoute}
        />
        <Text style={textWrapperStyle}>
          <User user={user} onGoToRoute={onGoToRoute} />
          <Text>{` Co-signed your Remix of `}</Text>
          <Entity
            entity={entity}
            entityType={EntityType.Track}
            onGoToRoute={onGoToRoute}
          />
        </Text>
      </View>
      <TwitterShare notification={notification} />
    </View>
  )
}

export default Cosign
