import React, { useCallback } from 'react'
import { StyleSheet, Text } from 'react-native'
import { Entity as EntityType } from 'src/store/notifications/types'
import { useTheme } from '../../../utils/theme'
import { getEntityRoute } from '../routeUtil'

const getEntityName = (entity: any) => entity.title || entity.playlist_name

const styles = StyleSheet.create({
  text: {
    fontFamily: 'AvenirNextLTPro-Bold',
    fontSize: 16
  }
})

type EntityProps = {
  entity: any
  entityType: EntityType
  onGoToRoute: (route: string) => void
}

const Entity = ({ entity, entityType, onGoToRoute }: EntityProps) => {
  const onPress = useCallback(() => {
    onGoToRoute(getEntityRoute(entity, entityType))
  }, [entity, entityType, onGoToRoute])

  const textStyle = useTheme(styles.text, {
    color: 'secondary'
  })

  return (
    <Text style={textStyle} onPress={onPress}>
      {getEntityName(entity)}
    </Text>
  )
}

export default Entity
