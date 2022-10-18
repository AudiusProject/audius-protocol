import { useCallback } from 'react'

import type { User } from '@audius/common'
import {
  followersUserListActions,
  followingUserListActions,
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
import { useDispatch, useSelector } from 'react-redux'

import IconCrown from 'app/assets/images/iconCrown.svg'
import IconNote from 'app/assets/images/iconNote.svg'
import IconSettings from 'app/assets/images/iconSettings.svg'
import IconUserFollowers from 'app/assets/images/iconUserFollowers.svg'
import IconUserList from 'app/assets/images/iconUserList.svg'
import { IconAudioBadge } from 'app/components/audio-rewards'
import { Divider, Text } from 'app/components/core'
import { ProfilePicture } from 'app/components/user'
import UserBadges from 'app/components/user-badges'
import { useRemoteVar } from 'app/hooks/useRemoteConfig'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import { useAppDrawerNavigation } from '../app-drawer-screen'
const { getAccountUser } = accountSelectors
const { getAccountTotalBalance } = walletSelectors
const { setFollowers } = followersUserListActions
const { setFollowing } = followingUserListActions

const messages = {
  audio: '$AUDIO & Rewards',
  settings: 'Settings'
}

type AccountDrawerProps = DrawerContentComponentProps & {
  disableGestures: boolean
  setDisableGestures: (disabled: boolean) => void
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  header: {
    paddingLeft: spacing(4),
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  accountImage: {
    height: spacing(12.5),
    width: spacing(12.5),
    marginBottom: spacing(3),
    borderWidth: 1
  },
  divider: {
    marginVertical: spacing(4)
  },
  accountInfo: {},
  accountBadges: { alignSelf: 'center' },
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
  accountName: { flexDirection: 'row' },
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

  const dispatch = useDispatch()
  const navigation = useAppDrawerNavigation()

  const handlePressAccount = useCallback(() => {
    navigation.navigate('Profile', { handle: 'accountUser' })
  }, [navigation])

  const handlePressRewards = useCallback(() => {
    navigation.navigate('AudioScreen')
  }, [navigation])

  const handlePressFollowing = useCallback(() => {
    dispatch(setFollowing(user_id))
    navigation.navigate('Following', { userId: user_id })
  }, [dispatch, user_id, navigation])

  const handlePressFollowers = useCallback(() => {
    dispatch(setFollowers(user_id))
    navigation.navigate('Followers', { userId: user_id })
  }, [dispatch, user_id, navigation])

  const handlePressSettings = useCallback(() => {
    navigation.navigate('SettingsScreen')
  }, [navigation])

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.header}>
        <Pressable style={styles.accountInfo} onPress={handlePressAccount}>
          <ProfilePicture profile={accountUser} style={styles.accountImage} />
          <View style={styles.accountName}>
            <Text variant='h1' noGutter>
              {name}
            </Text>
            <UserBadges
              user={accountUser}
              hideName
              style={styles.accountBadges}
            />
          </View>
          <Text weight='medium' fontSize='medium'>
            @{handle}
          </Text>
        </Pressable>
        <Pressable style={styles.tokens} onPress={handlePressRewards}>
          <IconAudioBadge tier={tier} showNoTier style={styles.tokenBadge} />
          <Text fontSize='large' weight='heavy'>
            {totalBalance ? formatWei(totalBalance) : 0}
          </Text>
        </Pressable>
      </View>
      <Divider style={styles.divider} />
      <View style={styles.accountStats}>
        <Pressable style={styles.accountStat} onPress={handlePressAccount}>
          <IconNote fill={neutralLight4} style={styles.accountStatIcon} />
          <View>
            <Text fontSize='large' weight='heavy'>
              {formatCount(track_count)}
            </Text>
          </View>
        </Pressable>
        <Pressable style={styles.accountStat} onPress={handlePressFollowing}>
          <IconUserList fill={neutralLight4} style={styles.accountStatIcon} />
          <Text fontSize='large' weight='heavy'>
            {formatCount(followee_count)}
          </Text>
        </Pressable>
        <Pressable style={styles.accountStat} onPress={handlePressFollowers}>
          <IconUserFollowers
            fill={neutralLight4}
            style={styles.accountStatIcon}
          />
          <Text fontSize='large' weight='heavy'>
            {formatCount(follower_count)}
          </Text>
        </Pressable>
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
