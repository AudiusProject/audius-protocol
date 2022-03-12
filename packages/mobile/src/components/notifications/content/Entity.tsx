import { useCallback } from 'react'

import { Entity as EntityType } from 'audius-client/src/common/store/notifications/types'
import { StyleSheet, Text } from 'react-native'
import { useDispatch } from 'react-redux'

import { useNavigation } from 'app/hooks/useNavigation'
import { close } from 'app/store/notifications/actions'
import { useTheme } from 'app/utils/theme'

import { getEntityRoute, getEntityScreen } from '../routeUtil'

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
}

const Entity = ({ entity, entityType }: EntityProps) => {
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const onPress = useCallback(() => {
    navigation.navigate({
      native: getEntityScreen(entity, entityType),
      web: { route: getEntityRoute(entity, entityType) }
    })
    dispatch(close())
  }, [entity, entityType, navigation, dispatch])

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
