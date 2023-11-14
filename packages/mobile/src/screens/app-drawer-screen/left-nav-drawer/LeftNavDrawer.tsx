import { useMemo } from 'react'

import type { BNUSDC, BNWei, User } from '@audius/common'
import {
  Status,
  FeatureFlags,
  StringKeys,
  accountSelectors,
  useAccountHasClaimableRewards,
  chatSelectors,
  Name,
  useSelectTierInfo,
  isNullOrUndefined,
  formatWei,
  walletSelectors,
  formatCurrencyBalance,
  formatUSDCWeiToFloorCentsNumber,
  useUSDCBalance
} from '@audius/common'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { DrawerContentScrollView } from '@react-navigation/drawer'
import BN from 'bn.js'
import { View } from 'react-native'
import Config from 'react-native-config'
import { useSelector } from 'react-redux'

import IconCrown from 'app/assets/images/iconCrown.svg'
import IconDonate from 'app/assets/images/iconDonate.svg'
import IconEmbed from 'app/assets/images/iconEmbed.svg'
import IconListeningHistory from 'app/assets/images/iconListeningHistory.svg'
import IconMessage from 'app/assets/images/iconMessage.svg'
import IconSettings from 'app/assets/images/iconSettings.svg'
import IconUpload from 'app/assets/images/iconUpload.svg'
import IconUser from 'app/assets/images/iconUser.svg'
import LogoUSDC from 'app/assets/images/logoUSDC.svg'
import { IconAudioBadge } from 'app/components/audio-rewards'
import { Text } from 'app/components/core'
import Skeleton from 'app/components/skeleton'
import { useFeatureFlag, useRemoteVar } from 'app/hooks/useRemoteConfig'
import { make, track } from 'app/services/analytics'
import { flexRowCentered, makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

import { AppDrawerContextProvider } from '../AppDrawerContext'

import { AccountDetails } from './AccountDetails'
import { LeftNavLink } from './LeftNavLink'
import { VanityMetrics } from './VanityMetrics'

const { getAccountUser } = accountSelectors
const { getHasUnreadMessages } = chatSelectors
const { getAccountTotalBalance } = walletSelectors

const isStaging = Config.ENVIRONMENT === 'staging'

const messages = {
  profile: 'Your Profile',
  payAndEarn: 'Pay & Earn',
  rewards: 'Rewards',
  upload: 'Upload',
  listeningHistory: 'Listening History',
  settings: 'Settings',
  featureFlags: 'Feature Flags'
}

type AccountDrawerProps = DrawerContentComponentProps & {
  gesturesDisabled: boolean
  setGesturesDisabled: (disabled: boolean) => void
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  tokens: {
    ...flexRowCentered(),
    padding: spacing(0.5),
    marginLeft: spacing(4),
    borderWidth: 1,
    borderColor: palette.neutralLight8,
    backgroundColor: palette.neutralLight10,
    borderRadius: spacing(25),
    gap: spacing(2)
  },
  tokenAmount: {
    paddingRight: spacing(1.5),
    paddingVertical: spacing(0.5)
  }
}))

/**
 * Pulls balances from account and wallet selectors. Will prefer the wallet
 * balance once it has loaded. Otherwise, will return the account balance if
 * available. Falls back to 0 if neither wallet or account balance are available.
 */
const useTotalBalanceWithFallback = () => {
  const account = useSelector(getAccountUser)
  const walletTotalBalance = useSelector(getAccountTotalBalance)

  return useMemo(() => {
    if (!isNullOrUndefined(walletTotalBalance)) {
      return walletTotalBalance
    } else if (
      !isNullOrUndefined(account) &&
      !isNullOrUndefined(account.total_balance)
    ) {
      return new BN(account.total_balance) as BNWei
    }

    return null
  }, [account, walletTotalBalance])
}

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
  const styles = useStyles()
  const challengeRewardIds = useRemoteVar(StringKeys.CHALLENGE_REWARD_IDS)
  const hasClaimableRewards = useAccountHasClaimableRewards(challengeRewardIds)
  const hasUnreadMessages = useSelector(getHasUnreadMessages)
  const { isEnabled: isChatEnabled } = useFeatureFlag(FeatureFlags.CHAT_ENABLED)
  const { isEnabled: isFeatureFlagAccessEnabled } = useFeatureFlag(
    FeatureFlags.FEATURE_FLAG_ACCESS
  )
  const accountUser = useSelector(getAccountUser) as User
  const { user_id } = accountUser
  const { tier } = useSelectTierInfo(user_id)
  const audioBalance = useTotalBalanceWithFallback()
  const isAudioBalanceLoading = isNullOrUndefined(audioBalance)

  const { data: usdcBalance, balanceStatus: usdcBalanceStatus } =
    useUSDCBalance({ isPolling: false })
  const isUsdcBalanceLoading =
    usdcBalance === null || usdcBalanceStatus === Status.LOADING
  const balanceCents = formatUSDCWeiToFloorCentsNumber(
    (usdcBalance ?? new BN(0)) as BNUSDC
  )
  const usdcBalanceFormatted = formatCurrencyBalance(balanceCents / 100)

  return (
    <DrawerContentScrollView>
      <AccountDetails />
      <VanityMetrics />
      {isChatEnabled ? (
        <LeftNavLink
          icon={IconMessage}
          label={'Messages'}
          to='ChatList'
          params={{}}
          onPress={() => {
            track(make({ eventName: Name.CHAT_ENTRY_POINT, source: 'navmenu' }))
          }}
          showNotificationBubble={hasUnreadMessages}
        />
      ) : null}
      <LeftNavLink
        icon={IconDonate}
        label={messages.payAndEarn}
        to='PayAndEarnScreen'
        params={null}
      >
        <View style={styles.tokens}>
          <LogoUSDC height={spacing(5)} width={spacing(5)} />
          {isUsdcBalanceLoading ? (
            <Skeleton style={styles.tokenAmount} height={spacing(4.5)} width={spacing(6)} />
          ) : (
            <Text style={styles.tokenAmount} fontSize='small' weight='bold'>
              ${usdcBalanceFormatted}
            </Text>
          )}
        </View>
      </LeftNavLink>
      <LeftNavLink
        icon={IconCrown}
        label={messages.rewards}
        to='AudioScreen'
        params={null}
        showNotificationBubble={hasClaimableRewards}
      >
        <View style={styles.tokens}>
          <IconAudioBadge
            tier={tier}
            showNoTier
            height={spacing(5)}
            width={spacing(5)}
          />
          {isAudioBalanceLoading ? (
            <Skeleton style={styles.tokenAmount} height={18} width={24} />
          ) : (
            <Text style={styles.tokenAmount} fontSize='small' weight='bold'>
              {formatWei(audioBalance, true, 0)}
            </Text>
          )}
        </View>
      </LeftNavLink>
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
      <LeftNavLink
        icon={IconListeningHistory}
        label={messages.listeningHistory}
        to='ListeningHistoryScreen'
        params={null}
      />
      <LeftNavLink
        icon={IconUser}
        label={messages.profile}
        to='Profile'
        params={{ handle: 'accountUser' }}
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
      {isStaging || isFeatureFlagAccessEnabled ? (
        <LeftNavLink
          icon={IconEmbed}
          label={messages.featureFlags}
          to='FeatureFlagOverride'
          params={null}
        />
      ) : null}
    </DrawerContentScrollView>
  )
}
