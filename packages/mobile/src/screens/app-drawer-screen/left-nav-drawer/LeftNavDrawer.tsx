import {
  useAccountHasClaimableRewards,
  useSelectTierInfo,
  useTotalBalanceWithFallback,
  useUSDCBalance
} from '@audius/common/hooks'
import type { BNUSDC, User } from '@audius/common/models'
import { Name, Status } from '@audius/common/models'
import { StringKeys, FeatureFlags } from '@audius/common/services'
import { accountSelectors, chatSelectors } from '@audius/common/store'
import {
  formatCurrencyBalance,
  formatUSDCWeiToFloorCentsNumber,
  formatWei,
  isNullOrUndefined
} from '@audius/common/utils'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { DrawerContentScrollView } from '@react-navigation/drawer'
import BN from 'bn.js'
import { useSelector } from 'react-redux'

import {
  IconCrown,
  IconDonate,
  IconEmbed,
  IconMessages,
  IconSettings,
  IconCloudUpload,
  IconUser,
  IconGift,
  IconAudiusLogo,
  Flex,
  Text
} from '@audius/harmony-native'
import LogoUSDC from 'app/assets/images/logoUSDC.svg'
import { IconAudioBadge } from 'app/components/audio-rewards'
import { BalancePill } from 'app/components/balance-pill/BalancePill'
import { env } from 'app/env'
import { useFeatureFlag, useRemoteVar } from 'app/hooks/useRemoteConfig'
import { make, track } from 'app/services/analytics'
import { spacing } from 'app/styles/spacing'

import { AppDrawerContextProvider } from '../AppDrawerContext'

import { AccountDetails } from './AccountDetails'
import { LeftNavLink } from './LeftNavLink'
import { VanityMetrics } from './VanityMetrics'

const { getHasAccount, getAccountUser } = accountSelectors
const { getHasUnreadMessages, getUnreadMessagesCount } = chatSelectors

const isStaging = env.ENVIRONMENT === 'staging'

const messages = {
  profile: 'My Profile',
  usdc: 'USDC',
  audio: '$AUDIO',
  rewards: 'Rewards',
  upload: 'Upload',
  settings: 'Settings',
  featureFlags: 'Feature Flags',
  usdcDollarSign: (balance: string) => `$${balance}`
}

type AccountDrawerProps = DrawerContentComponentProps & {
  gesturesDisabled: boolean
  setGesturesDisabled: (disabled: boolean) => void
}

export const LeftNavDrawer = (props: AccountDrawerProps) => {
  const { navigation: drawerHelpers, ...other } = props
  const hasAccount = useSelector(getHasAccount)
  if (!hasAccount) return null

  return (
    <AppDrawerContextProvider drawerHelpers={drawerHelpers} {...other}>
      <WrappedLeftNavDrawer />
    </AppDrawerContextProvider>
  )
}

const WrappedLeftNavDrawer = () => {
  const { isEnabled: isFeatureFlagAccessEnabled } = useFeatureFlag(
    FeatureFlags.FEATURE_FLAG_ACCESS
  )
  const challengeRewardIds = useRemoteVar(StringKeys.CHALLENGE_REWARD_IDS)
  const hasClaimableRewards = useAccountHasClaimableRewards(challengeRewardIds)
  const hasUnreadMessages = useSelector(getHasUnreadMessages)
  const unreadMessagesCount = useSelector(getUnreadMessagesCount)
  const accountUser = useSelector(getAccountUser) as User
  const { user_id } = accountUser
  const { tier } = useSelectTierInfo(user_id)
  const audioBalance = useTotalBalanceWithFallback()
  const audioBalanceFormatted = formatWei(audioBalance, true, 0)
  const isAudioBalanceLoading = isNullOrUndefined(audioBalance)
  const audioBadge = (
    <IconAudioBadge
      tier={tier}
      showNoTier
      height={spacing(5)}
      width={spacing(5)}
    />
  )
  const { data: usdcBalance, status: usdcBalanceStatus } = useUSDCBalance()
  const balanceCents = formatUSDCWeiToFloorCentsNumber(
    (usdcBalance ?? new BN(0)) as BNUSDC
  )
  const usdcBalanceFormatted = formatCurrencyBalance(balanceCents / 100)
  const isUSDCBalanceLoading = usdcBalanceStatus === Status.LOADING

  return (
    <DrawerContentScrollView>
      <AccountDetails />
      <VanityMetrics />
      <LeftNavLink
        icon={IconUser}
        label={messages.profile}
        to='Profile'
        params={{ handle: 'accountUser' }}
      />
      <LeftNavLink
        icon={IconMessages}
        label={'Messages'}
        to='ChatList'
        params={{}}
        onPress={() => {
          track(make({ eventName: Name.CHAT_ENTRY_POINT, source: 'navmenu' }))
        }}
        showNotificationBubble={hasUnreadMessages}
      >
        <Flex
          row
          alignItems='center'
          borderRadius='xl'
          backgroundColor='primary'
          ph='s'
          pv='xs'
        >
          <Text variant='label' size='xs' color='staticWhite'>
            {unreadMessagesCount}
          </Text>
        </Flex>
      </LeftNavLink>
      <LeftNavLink
        icon={IconCrown}
        label={messages.audio}
        to='AudioScreen'
        params={null}
      >
        <BalancePill
          balance={audioBalanceFormatted}
          icon={audioBadge}
          isLoading={isAudioBalanceLoading}
        />
      </LeftNavLink>
      <LeftNavLink
        icon={IconDonate}
        label={messages.usdc}
        to='PayAndEarnScreen'
        params={null}
      >
        <BalancePill
          balance={messages.usdcDollarSign(usdcBalanceFormatted)}
          icon={<LogoUSDC height={spacing(5)} width={spacing(5)} />}
          isLoading={isUSDCBalanceLoading}
        />
      </LeftNavLink>
      <LeftNavLink
        icon={IconGift}
        label={messages.rewards}
        to='AudioScreen'
        params={null}
        showNotificationBubble={hasClaimableRewards}
      />
      <LeftNavLink
        icon={IconCloudUpload}
        label={messages.upload}
        to='Upload'
        params={{ fromAppDrawer: false }}
      />
      <LeftNavLink
        icon={IconSettings}
        label={messages.settings}
        to='SettingsScreen'
        params={null}
      />
      {isStaging || isFeatureFlagAccessEnabled ? (
        <LeftNavLink
          icon={IconEmbed}
          label={messages.featureFlags}
          to='FeatureFlagOverride'
          params={null}
        />
      ) : null}
      <Flex pt='5xl' ph='l'>
        <IconAudiusLogo color='subdued' />
      </Flex>
    </DrawerContentScrollView>
  )
}
