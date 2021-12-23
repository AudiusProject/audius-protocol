import React from 'react'

import { StyleSheet, Text, View } from 'react-native'

import Track from 'app/models/Track'
import {
  RemixCreate as RemixNotification,
  Entity as EntityType
} from 'app/store/notifications/types'

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
  notification: RemixNotification
  onGoToRoute: (route: string) => void
}

const Remix = ({ notification, onGoToRoute }: RemixProps) => {
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
        <Entity
          entity={original}
          entityType={EntityType.Track}
          onGoToRoute={onGoToRoute}
        />
      </Text>

      <View style={styles.body}>
        <UserImages
          notification={notification}
          users={[user]}
          onGoToRoute={onGoToRoute}
        />
        <Text style={styles.bodyText}>
          <Entity
            entity={entity}
            entityType={EntityType.Track}
            onGoToRoute={onGoToRoute}
          />
          <Text>{` by `}</Text>
          <User user={user} onGoToRoute={onGoToRoute} />
        </Text>
      </View>
      <TwitterShare notification={notification} />
    </View>
  )
}

export default Remix
