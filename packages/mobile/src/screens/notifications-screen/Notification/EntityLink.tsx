import { useCallback } from 'react'

import type { Collection, Track } from '@audius/common/models'

import { Text } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

type EntityLinkProps = {
  entity: Track | Collection
}

export const EntityLink = (props: EntityLinkProps) => {
  const { entity } = props
  const navigation = useNavigation()

  const onPress = useCallback(() => {
    if ('track_id' in entity) {
      navigation.navigate('Track', {
        id: entity.track_id,
        fromNotifications: true
      })
    } else if ('playlist_id' in entity) {
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
