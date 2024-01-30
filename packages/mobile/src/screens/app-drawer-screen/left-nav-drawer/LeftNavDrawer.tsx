import {
  FeatureFlags,
  StringKeys,
  accountSelectors,
  chatSelectors
} from '@audius/common'
import { useAccountHasClaimableRewards } from '@audius/common/hooks'
import type { User } from '@audius/common/models'
import { Name } from '@audius/common/models'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { DrawerContentScrollView } from '@react-navigation/drawer'
import { useSelector } from 'react-redux'

import IconCrown from 'app/assets/images/iconCrown.svg'
import IconDonate from 'app/assets/images/iconDonate.svg'
import IconEmbed from 'app/assets/images/iconEmbed.svg'
import IconListeningHistory from 'app/assets/images/iconListeningHistory.svg'
import IconMessage from 'app/assets/images/iconMessage.svg'
import IconSettings from 'app/assets/images/iconSettings.svg'
import IconUpload from 'app/assets/images/iconUpload.svg'
import IconUser from 'app/assets/images/iconUser.svg'
import { AudioBalancePill } from 'app/components/audio-balance-pill/AUDIOBalancePill'
import { USDCBalancePill } from 'app/components/usdc-balance-pill/USDCBalancePill'
import { env } from 'app/env'
import { useFeatureFlag, useRemoteVar } from 'app/hooks/useRemoteConfig'
import { make, track } from 'app/services/analytics'
import { spacing } from 'app/styles/spacing'

import { AppDrawerContextProvider } from '../AppDrawerContext'

import { AccountDetails } from './AccountDetails'
import { LeftNavLink } from './LeftNavLink'
import { VanityMetrics } from './VanityMetrics'

const { getAccountUser } = accountSelectors
const { getHasUnreadMessages } = chatSelectors

const isStaging = env.ENVIRONMENT === 'staging'

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
  const challengeRewardIds = useRemoteVar(StringKeys.CHALLENGE_REWARD_IDS)
  const hasClaimableRewards = useAccountHasClaimableRewards(challengeRewardIds)
  const hasUnreadMessages = useSelector(getHasUnreadMessages)
  const { isEnabled: isChatEnabled } = useFeatureFlag(FeatureFlags.CHAT_ENABLED)
  const { isEnabled: isFeatureFlagAccessEnabled } = useFeatureFlag(
    FeatureFlags.FEATURE_FLAG_ACCESS
  )

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
        <USDCBalancePill />
      </LeftNavLink>
      <LeftNavLink
        icon={IconCrown}
        label={messages.rewards}
        to='AudioScreen'
        params={null}
        showNotificationBubble={hasClaimableRewards}
      >
        <AudioBalancePill />
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
