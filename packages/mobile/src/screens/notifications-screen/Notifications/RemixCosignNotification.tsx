import { useCallback } from 'react'

import {
  getNotificationEntities,
  getNotificationUser
} from 'audius-client/src/common/store/notifications/selectors'
import { RemixCosign } from 'audius-client/src/common/store/notifications/types'
import { isEqual } from 'lodash'
import { View } from 'react-native'

import IconRemix from 'app/assets/images/iconRemix.svg'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { getTrackRoute } from 'app/utils/routes'

import {
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  EntityLink,
  UserNameLink,
  ProfilePicture
} from '../Notification'
import { useDrawerNavigation } from '../useDrawerNavigation'

const messages = {
  title: 'Remix Co-sign',
  cosign: 'Co-signed your Remix of'
}

type RemixCosignNotificationProps = {
  notification: RemixCosign
}

export const RemixCosignNotification = (
  props: RemixCosignNotificationProps
) => {
  const { notification } = props
  const navigation = useDrawerNavigation()
  const { childTrackId, parentTrackUserId } = notification
  const user = useSelectorWeb(state => getNotificationUser(state, notification))
  const tracks = useSelectorWeb(
    state => getNotificationEntities(state, notification),
    isEqual
  )

  const childTrack = tracks.find(({ track_id }) => track_id === childTrackId)
  const parentTrack = tracks.find(
    ({ owner_id }) => owner_id === parentTrackUserId
  )

  const handlePress = useCallback(() => {
    if (childTrack) {
      navigation.navigate({
        native: {
          screen: 'Track',
          params: { id: childTrack.track_id, fromNotifications: true }
        },
        web: {
          route: getTrackRoute(childTrack)
        }
      })
    }
  }, [childTrack, navigation])

  if (!user || !childTrack || !parentTrack) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconRemix}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ProfilePicture profile={user} />
        <View style={{ flex: 1 }}>
          <NotificationText>
            <UserNameLink user={user} /> {messages.cosign}{' '}
            <EntityLink entity={parentTrack} />
          </NotificationText>
        </View>
      </View>
    </NotificationTile>
  )
}
