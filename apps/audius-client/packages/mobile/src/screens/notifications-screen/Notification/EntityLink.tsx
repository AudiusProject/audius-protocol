import { useCallback } from 'react'

import type { EntityType } from '@audius/common'

import { Text } from 'app/components/core'

import { useDrawerNavigation } from '../useDrawerNavigation'

type EntityLinkProps = {
  entity: EntityType
}

export const EntityLink = (props: EntityLinkProps) => {
  const { entity } = props
  const navigation = useDrawerNavigation()

  const onPress = useCallback(() => {
    if ('track_id' in entity) {
      navigation.navigate('Track', {
        id: entity.track_id,
        fromNotifications: true
      })
    } else if (entity.user) {
      navigation.navigate('Collection', {
        id: entity.playlist_id,
        fromNotifications: true
      })
    }
  }, [entity, navigation])

  return (
    <Text fontSize='large' weight='medium' color='secondary' onPress={onPress}>
      {'title' in entity ? entity.title : entity.playlist_name}
    </Text>
  )
}
