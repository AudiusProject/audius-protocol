import { useCallback } from 'react'

import { accountSelectors } from '@audius/common/store'
import { css } from '@emotion/native'
import { useTheme } from '@emotion/react'
import { Text, View } from 'react-native'
import { useSelector } from 'react-redux'

import { ProfilePicture } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import type { ProfileTabScreenParamList } from '../app-screen/ProfileTabScreen'

import { SettingsRow } from './SettingsRow'
const { getUserHandle, getUserName, getUserId } = accountSelectors

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
  const accountUserId = useSelector(getUserId)
  const accountHandle = useSelector(getUserHandle)
  const accountName = useSelector(getUserName)
  const navigation = useNavigation<ProfileTabScreenParamList>()
  const { spacing } = useTheme()

  const handlePress = useCallback(() => {
    navigation.push('AccountSettingsScreen')
  }, [navigation])

  if (!accountUserId) return null

  return (
    <SettingsRow style={styles.root} onPress={handlePress}>
      <View style={styles.content}>
        <ProfilePicture
          userId={accountUserId}
          style={css({ width: spacing.unit13, height: spacing.unit13 })}
          borderWidth='thin'
        />
        <View style={styles.info}>
          <Text style={styles.name}>{accountName}</Text>
          <Text style={styles.handle}>@{accountHandle}</Text>
        </View>
      </View>
    </SettingsRow>
  )
}
