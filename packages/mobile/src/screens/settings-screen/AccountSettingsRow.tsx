import { useCallback } from 'react'

import { useCurrentAccountUser } from '@audius/common/api'
import { css } from '@emotion/native'
import { useTheme } from '@emotion/react'
import { pick } from 'lodash'
import { Text, View } from 'react-native'

import { ProfilePicture } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import type { ProfileTabScreenParamList } from '../app-screen/ProfileTabScreen'

import { SettingsRow } from './SettingsRow'

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
  const { data: accountData } = useCurrentAccountUser({
    select: (user) => pick(user, ['user_id', 'handle', 'name'])
  })
  const { user_id, handle, name } = accountData ?? {}
  const navigation = useNavigation<ProfileTabScreenParamList>()
  const { spacing } = useTheme()

  const handlePress = useCallback(() => {
    navigation.push('AccountSettingsScreen')
  }, [navigation])

  if (!user_id) return null

  return (
    <SettingsRow style={styles.root} onPress={handlePress}>
      <View style={styles.content}>
        <ProfilePicture
          userId={user_id}
          style={css({ width: spacing.unit13, height: spacing.unit13 })}
          borderWidth='thin'
        />
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.handle}>@{handle}</Text>
        </View>
      </View>
    </SettingsRow>
  )
}
