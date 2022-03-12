import { Track } from 'audius-client/src/common/models/Track'
import {
  Entity as EntityType,
  RemixCreate
} from 'audius-client/src/common/store/notifications/types'
import { StyleSheet, Text, View } from 'react-native'

import Entity from './Entity'
import TwitterShare from './TwitterShare'
import User from './User'
import UserImages from './UserImages'

const styles = StyleSheet.create({
  titleText: {
    fontFamily: 'AvenirNextLTPro-Medium',
    fontSize: 16,
    color: '#858199'
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    flexWrap: 'wrap'
  },
  bodyText: {
    fontFamily: 'AvenirNextLTPro-Medium',
    fontSize: 16,
    color: '#858199',
    marginLeft: 4
  }
})

type RemixProps = {
  notification: RemixCreate
}

const Remix = ({ notification }: RemixProps) => {
  const user = notification.user
  if (!user) return null

  const entity = notification.entities.find(
    (track: Track) => track.track_id === notification.childTrackId
  )
  const original = notification.entities.find(
    (track: Track) => track.track_id === notification.parentTrackId
  )

  return (
    <View>
      <Text style={styles.titleText}>
        <Text>{`New remix of your track `}</Text>
        <Entity entity={original} entityType={EntityType.Track} />
      </Text>

      <View style={styles.body}>
        <UserImages notification={notification} users={[user]} />
        <Text style={styles.bodyText}>
          <Entity entity={entity} entityType={EntityType.Track} />
          <Text>{` by `}</Text>
          <User user={user} />
        </Text>
      </View>
      <TwitterShare notification={notification} />
    </View>
  )
}

export default Remix
