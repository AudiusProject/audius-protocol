import { useCallback } from 'react'

import type { User } from '@audius/common'
import {
  StringKeys,
  formatCount,
  formatWei,
  walletSelectors,
  accountSelectors,
  useSelectTierInfo,
  useAccountHasClaimableRewards
} from '@audius/common'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { DrawerContentScrollView } from '@react-navigation/drawer'
import { Pressable, TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'

import IconCrown from 'app/assets/images/iconCrown.svg'
import IconNote from 'app/assets/images/iconNote.svg'
import IconSettings from 'app/assets/images/iconSettings.svg'
import IconUserFollowers from 'app/assets/images/iconUserFollowers.svg'
import IconUserList from 'app/assets/images/iconUserList.svg'
import { IconAudioBadge } from 'app/components/audio-rewards'
import { Divider, Text } from 'app/components/core'
import { ProfilePicture } from 'app/components/user'
import { useRemoteVar } from 'app/hooks/useRemoteConfig'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import { useAppDrawerNavigation } from '../app-drawer-screen'
const { getAccountUser } = accountSelectors
const { getAccountTotalBalance } = walletSelectors

const messages = {
  audio: '$AUDIO & Rewards',
  settings: 'Settings'
}

type AccountDrawerProps = DrawerContentComponentProps

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {},
  header: {
    paddingLeft: spacing(4),
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  accountImage: {
    height: spacing(12),
    width: spacing(12),
    marginBottom: spacing(3)
  },
  divider: {
    marginVertical: spacing(4)
  },
  accountInfo: {},
  tokens: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing(4)
  },
  tokenBadge: {
    height: spacing(7),
    width: spacing(7),
    marginRight: spacing(1)
  },
  accountStats: { flexDirection: 'row', paddingLeft: spacing(4) },
  accountStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing(4)
  },
  accountStatIcon: {
    marginRight: spacing(1)
  },
  accountListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing(6),
    paddingVertical: spacing(4)
  },
  accountListItemIcon: {
    marginRight: spacing(2),
    paddingVertical: spacing(1)
  },
  notificationBubble: {
    height: spacing(3),
    width: spacing(3),
    borderRadius: spacing(3),
    backgroundColor: palette.secondary,
    marginLeft: spacing(2)
  }
}))

export const AccountDrawer = (props: AccountDrawerProps) => {
  const styles = useStyles()
  const accountUser = useSelector(getAccountUser) as User
  const { user_id, name, handle, track_count, followee_count, follower_count } =
    accountUser
  const { tier } = useSelectTierInfo(user_id)
  const totalBalance = useSelector(getAccountTotalBalance)
  const challengeRewardIds = useRemoteVar(StringKeys.CHALLENGE_REWARD_IDS)
  const hasClaimableRewards = useAccountHasClaimableRewards(challengeRewardIds)
  const { neutral, neutralLight4 } = useThemeColors()

  const navigation = useAppDrawerNavigation()

  const handlePressAccount = useCallback(() => {
    navigation.navigate('Profile', { handle: 'accountUser' })
  }, [navigation])

  const handlePressRewards = useCallback(() => {
    navigation.navigate('AudioScreen')
  }, [navigation])

  const handlePressSettings = useCallback(() => {
    navigation.navigate('SettingsScreen')
  }, [navigation])

  return (
    <DrawerContentScrollView {...props} style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.accountInfo} onPress={handlePressAccount}>
          <ProfilePicture profile={accountUser} style={styles.accountImage} />
          <Text variant='h1' noGutter>
            {name}
          </Text>
          <Text weight='medium' fontSize='medium'>
            @{handle}
          </Text>
        </Pressable>
        <View style={styles.tokens}>
          <IconAudioBadge tier={tier} showNoTier style={styles.tokenBadge} />
          <Text fontSize='large' weight='heavy'>
            {totalBalance ? formatWei(totalBalance) : 0}
          </Text>
        </View>
      </View>
      <Divider style={styles.divider} />
      <View style={styles.accountStats}>
        <View style={styles.accountStat}>
          <IconNote fill={neutralLight4} style={styles.accountStatIcon} />
          <View>
            <Text fontSize='large' weight='heavy'>
              {formatCount(track_count)}
            </Text>
          </View>
        </View>
        <View style={styles.accountStat}>
          <IconUserList fill={neutralLight4} style={styles.accountStatIcon} />
          <Text fontSize='large' weight='heavy'>
            {formatCount(followee_count)}
          </Text>
        </View>
        <View style={styles.accountStat}>
          <IconUserFollowers
            fill={neutralLight4}
            style={styles.accountStatIcon}
          />
          <Text fontSize='large' weight='heavy'>
            {formatCount(follower_count)}
          </Text>
        </View>
      </View>
      <Divider style={styles.divider} />
      <TouchableOpacity
        style={styles.accountListItem}
        onPress={handlePressRewards}
      >
        <IconCrown
          fill={neutral}
          height={spacing(7)}
          width={spacing(7)}
          style={styles.accountListItemIcon}
        />
        <Text
          fontSize='large'
          weight='demiBold'
          style={{ marginTop: spacing(1) }}
        >
          {messages.audio}
        </Text>
        {hasClaimableRewards ? (
          <View style={styles.notificationBubble} />
        ) : null}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.accountListItem}
        onPress={handlePressSettings}
      >
        <IconSettings
          fill={neutral}
          height={spacing(9)}
          width={spacing(9)}
          style={[styles.accountListItemIcon, { marginLeft: spacing(-1) }]}
        />
        <Text fontSize='large' weight='demiBold' style={{ marginTop: 2 }}>
          {messages.settings}
        </Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  )
}
