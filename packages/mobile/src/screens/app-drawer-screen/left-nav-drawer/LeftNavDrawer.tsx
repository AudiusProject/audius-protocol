import { useCallback, useContext } from 'react'

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
  useAccountHasClaimableRewards,
  FeatureFlags
} from '@audius/common'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { DrawerContentScrollView } from '@react-navigation/drawer'
import { TouchableOpacity, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconCrown from 'app/assets/images/iconCrown.svg'
import IconListeningHistory from 'app/assets/images/iconListeningHistory.svg'
import IconNote from 'app/assets/images/iconNote.svg'
import IconSettings from 'app/assets/images/iconSettings.svg'
import IconUpload from 'app/assets/images/iconUpload.svg'
import IconUser from 'app/assets/images/iconUser.svg'
import IconUserFollowers from 'app/assets/images/iconUserFollowers.svg'
import IconUserList from 'app/assets/images/iconUserList.svg'
import { IconAudioBadge } from 'app/components/audio-rewards'
import { Divider, Text } from 'app/components/core'
import { ProfilePicture } from 'app/components/user'
import UserBadges from 'app/components/user-badges'
import { useFeatureFlag, useRemoteVar } from 'app/hooks/useRemoteConfig'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import { AppDrawerContext, AppDrawerContextProvider } from '../AppDrawerContext'
import { useAppDrawerNavigation } from '../useAppDrawerNavigation'

import { LeftNavLink } from './LeftNavLink'
const { getAccountUser } = accountSelectors
const { getAccountTotalBalance } = walletSelectors
const { setFollowers } = followersUserListActions
const { setFollowing } = followingUserListActions

const messages = {
  profile: 'Profile',
  audio: '$AUDIO & Rewards',
  upload: 'Upload a Track',
  listeningHistory: 'Listening History',
  settings: 'Settings'
}

const accountStatHitSlop = {
  top: spacing(2),
  right: spacing(2),
  bottom: spacing(2),
  left: spacing(2)
}

type AccountDrawerProps = DrawerContentComponentProps & {
  gesturesDisabled: boolean
  setGesturesDisabled: (disabled: boolean) => void
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
  accountListItemIconRoot: {
    width: spacing(10)
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

export const LeftNavDrawer = (props: AccountDrawerProps) => {
  const { navigation: drawerHelpers, ...other } = props
  const accountUser = useSelector(getAccountUser) as User
  if (!accountUser) return null
  return (
    <AppDrawerContextProvider drawerHelpers={drawerHelpers} {...other}>
      <WrappedLeftNavDrawer />
    </AppDrawerContextProvider>
  )
}

const WrappedLeftNavDrawer = () => {
  const { drawerHelpers } = useContext(AppDrawerContext)
  const styles = useStyles()
  const accountUser = useSelector(getAccountUser) as User
  const { user_id, name, handle, track_count, followee_count, follower_count } =
    accountUser
  const { tier } = useSelectTierInfo(user_id)
  const totalBalance = useSelector(getAccountTotalBalance)
  const challengeRewardIds = useRemoteVar(StringKeys.CHALLENGE_REWARD_IDS)
  const hasClaimableRewards = useAccountHasClaimableRewards(challengeRewardIds)
  const { neutralLight4 } = useThemeColors()

  const dispatch = useDispatch()
  const navigation = useAppDrawerNavigation()

  const { isEnabled: isMobileUploadEnabled } = useFeatureFlag(
    FeatureFlags.MOBILE_UPLOAD
  )

  const handlePressAccount = useCallback(() => {
    navigation.push('Profile', { handle: 'accountUser' })
    drawerHelpers.closeDrawer()
  }, [navigation, drawerHelpers])

  const handlePressRewards = useCallback(() => {
    navigation.push('AudioScreen')
    drawerHelpers.closeDrawer()
  }, [navigation, drawerHelpers])

  const handlePressFollowing = useCallback(() => {
    dispatch(setFollowing(user_id))
    navigation.push('Following', { userId: user_id })
    drawerHelpers.closeDrawer()
  }, [dispatch, user_id, navigation, drawerHelpers])

  const handlePressFollowers = useCallback(() => {
    dispatch(setFollowers(user_id))
    navigation.push('Followers', { userId: user_id })
    drawerHelpers.closeDrawer()
  }, [dispatch, user_id, navigation, drawerHelpers])

  return (
    <DrawerContentScrollView>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.accountInfo}
          onPress={handlePressAccount}
        >
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
        </TouchableOpacity>
        <TouchableOpacity style={styles.tokens} onPress={handlePressRewards}>
          <IconAudioBadge
            tier={tier}
            showNoTier
            style={styles.tokenBadge}
            height={spacing(7)}
            width={spacing(7)}
          />
          <Text fontSize='large' weight='heavy'>
            {totalBalance ? formatWei(totalBalance, true, 0) : 0}
          </Text>
        </TouchableOpacity>
      </View>
      <Divider style={styles.divider} />
      <View style={styles.accountStats}>
        <TouchableOpacity
          style={styles.accountStat}
          onPress={handlePressAccount}
          hitSlop={accountStatHitSlop}
        >
          <IconNote
            fill={neutralLight4}
            style={[styles.accountStatIcon, { marginRight: 2 }]}
            height={30}
            width={30}
          />
          <View>
            <Text fontSize='large' weight='heavy'>
              {formatCount(track_count)}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.accountStat}
          onPress={handlePressFollowing}
          hitSlop={accountStatHitSlop}
        >
          <IconUserList fill={neutralLight4} style={styles.accountStatIcon} />
          <Text fontSize='large' weight='heavy'>
            {formatCount(followee_count)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.accountStat}
          onPress={handlePressFollowers}
          hitSlop={accountStatHitSlop}
        >
          <IconUserFollowers
            fill={neutralLight4}
            style={styles.accountStatIcon}
          />
          <Text fontSize='large' weight='heavy'>
            {formatCount(follower_count)}
          </Text>
        </TouchableOpacity>
      </View>
      <Divider style={styles.divider} />
      <LeftNavLink
        icon={IconUser}
        label={messages.profile}
        to='Profile'
        params={{ handle: 'accountUser' }}
      />
      <LeftNavLink
        icon={IconCrown}
        label={messages.audio}
        to='AudioScreen'
        params={null}
      >
        {hasClaimableRewards ? (
          <View style={styles.notificationBubble} />
        ) : null}
      </LeftNavLink>
      {isMobileUploadEnabled ? (
        <LeftNavLink
          icon={IconUpload}
          iconProps={{
            height: spacing(8),
            width: spacing(8),
            style: { marginLeft: -2 }
          }}
          label={messages.upload}
          to='Upload'
          params={{ fromAppDrawer: false }}
        />
      ) : null}
      <LeftNavLink
        icon={IconListeningHistory}
        label={messages.listeningHistory}
        to='ListeningHistoryScreen'
        params={null}
      />
      <LeftNavLink
        icon={IconSettings}
        label={messages.settings}
        to='SettingsScreen'
        params={null}
        iconProps={{
          height: spacing(9),
          width: spacing(9),
          style: { marginLeft: spacing(-1) }
        }}
      />
    </DrawerContentScrollView>
  )
}
