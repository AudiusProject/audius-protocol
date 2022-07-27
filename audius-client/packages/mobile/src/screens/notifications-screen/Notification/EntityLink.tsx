import { useCallback } from 'react'

import type { EntityType } from 'audius-client/src/common/store/notifications/types'
import { useDispatch } from 'react-redux'

import { Text } from 'app/components/core'
import { close } from 'app/store/notifications/actions'
import { getCollectionRoute, getTrackRoute } from 'app/utils/routes'

import { useDrawerNavigation } from '../useDrawerNavigation'

type EntityLinkProps = {
  entity: EntityType
}

export const EntityLink = (props: EntityLinkProps) => {
  const { entity } = props
  const dispatch = useDispatch()
  const navigation = useDrawerNavigation()

  const onPress = useCallback(() => {
    if ('track_id' in entity) {
      navigation.navigate({
        native: {
          screen: 'Track',
          params: { id: entity.track_id, fromNotifications: true }
        },
        web: { route: getTrackRoute(entity) }
      })
    } else if (entity.user) {
      const { user } = entity

      navigation.navigate({
        native: {
          screen: 'Collection',
          params: { id: entity.playlist_id, fromNotifications: true }
        },
        web: { route: getCollectionRoute({ ...entity, user }) }
      })
    }
    dispatch(close())
  }, [entity, navigation, dispatch])

  return (
    <Text fontSize='large' weight='medium' color='secondary' onPress={onPress}>
      {'title' in entity ? entity.title : entity.playlist_name}
    </Text>
  )
}
