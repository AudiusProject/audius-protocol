import { useCallback } from 'react'

import { accountSelectors } from '@audius/common/store'
import { Text, View } from 'react-native'
import { useSelector } from 'react-redux'

import { ProfilePicture } from 'app/components/user'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import type { ProfileTabScreenParamList } from '../app-screen/ProfileTabScreen'

import { SettingsRow } from './SettingsRow'
const getAccountUser = accountSelectors.getAccountUser

const useStyles = makeStyles(({ typography, spacing, palette }) => ({
  root: { paddingVertical: spacing(4) },
  content: { flexDirection: 'row', alignItems: 'center' },
  profilePicture: { height: 52, width: 52 },
  info: { marginLeft: spacing(4) },
  name: { ...typography.h2, color: palette.neutral },
  handle: {
    ...typography.h2,
    color: palette.neutral,
    fontFamily: typography.fontByWeight.medium
  }
}))

export const AccountSettingsRow = () => {
  const styles = useStyles()
  const accountUser = useSelector(getAccountUser)
  const navigation = useNavigation<ProfileTabScreenParamList>()

  const handlePress = useCallback(() => {
    navigation.push('AccountSettingsScreen')
  }, [navigation])

  if (!accountUser) return null

  const { name, handle } = accountUser

  return (
    <SettingsRow style={styles.root} onPress={handlePress}>
      <View style={styles.content}>
        <ProfilePicture profile={accountUser} style={styles.profilePicture} />
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.handle}>@{handle}</Text>
        </View>
      </View>
    </SettingsRow>
  )
}
