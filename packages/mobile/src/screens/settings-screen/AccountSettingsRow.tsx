import { useCallback } from 'react'

import { getAccountUser } from 'audius-client/src/common/store/account/selectors'
import { Text, View } from 'react-native'

import { ProfileStackParamList } from 'app/components/app-navigator/types'
import { ProfilePhoto } from 'app/components/user'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { SettingsRow } from './SettingsRow'

const useStyles = makeStyles(({ typography, spacing, palette }) => ({
  root: { paddingVertical: spacing(5) },
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
  const accountUser = useSelectorWeb(getAccountUser)
  const navigation = useNavigation<ProfileStackParamList>()

  const handlePress = useCallback(() => {
    navigation.push({
      native: { screen: 'AccountSettingsScreen', params: undefined },
      web: { route: '/settings/account' }
    })
  }, [navigation])

  if (!accountUser) return null

  const { name, handle } = accountUser

  return (
    <SettingsRow style={styles.root} onPress={handlePress}>
      <View style={styles.content}>
        <ProfilePhoto profile={accountUser} style={styles.profilePicture} />
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.handle}>@{handle}</Text>
        </View>
      </View>
    </SettingsRow>
  )
}
