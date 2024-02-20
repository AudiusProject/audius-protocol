import { Box, Flex, Text } from '@audius/harmony'
import BN from 'bn.js'
import Button, { ButtonType } from 'components/Button'
import { Card } from 'components/Card/Card'
import UserImage from 'components/UserImage'
import UserBadges from 'components/UserInfo/AudiusProfileBadges'
import { useCallback } from 'react'
import { useAccount } from 'store/account/hooks'
import { useUser } from 'store/cache/user/hooks'
import { Address, Status } from 'types'
import getActiveStake from 'utils/activeStake'
import { TICKER } from 'utils/consts'
import { usePushRoute } from 'utils/effects'
import { formatShortWallet } from 'utils/format'
import { accountPage } from 'utils/routes'

import AudiusClient from 'services/Audius/AudiusClient'
import {
  useUserAnnualRewardRate,
  useUserWeeklyRewards
} from 'store/cache/rewards/hooks'
import styles from './ManageAccountCard.module.css'

const messages = {
  estimatedReward: `Estimated ${TICKER} Reward`,
  delegatingTo: 'Delegating To',
  weekly: 'Weekly',
  annual: 'Annual',
  delegatedToken: `Delegated ${TICKER}`,
  profileAlt: 'User Profile',
  manage: 'Manage'
}

type DelegateInfoProps = { wallet: Address }

const DelegateInfo = ({ wallet }: DelegateInfoProps) => {
  const { user, audiusProfile } = useUser({ wallet })
  const pushRoute = usePushRoute()
  const onClickUser = useCallback(() => {
    if (user) {
      pushRoute(accountPage(user.wallet))
    }
  }, [user, pushRoute])

  if (!user) return null

  return (
    <Flex gap="s" onClick={onClickUser}>
      <Flex gap="s" alignItems="center">
        <UserImage
          wallet={wallet}
          imgClassName={styles.snippetImg}
          alt={messages.profileAlt}
          useSkeleton={false}
        />
        {audiusProfile != null ? null : (
          <Text variant="body" size="m" strength="strong">
            {formatShortWallet(user.wallet)}
          </Text>
        )}
      </Flex>
      {audiusProfile == null ? null : (
        <Flex direction="column" gap="xs">
          <Flex gap="xs" alignItems="center">
            <Text variant="heading" size="s" strength="default" tag="span">
              {audiusProfile.name}
            </Text>
            <UserBadges inline audiusProfile={audiusProfile} badgeSize={14} />
          </Flex>
          <Box>
            <Text variant="body" size="m" strength="strong">
              {formatShortWallet(user.wallet)}
            </Text>
          </Box>
        </Flex>
      )}
    </Flex>
  )
}

type UserAudioRewardEstimateProps = {
  wallet: Address
  /** If the estimate is for a certain delegate that the user has delegated to, specify the address here. Otherwise, this will show total AUDIO rewards estimate across all delegates. */
  delegateAddress?: string
}
const UserAudioRewardEstimate = ({
  wallet,
  delegateAddress
}: UserAudioRewardEstimateProps) => {
  const weeklyRewards = useUserWeeklyRewards({ wallet })
  const annualRewards = useUserAnnualRewardRate({ wallet })
  const isLoading =
    weeklyRewards.status === Status.Loading ||
    annualRewards.status === Status.Loading
  const annual = delegateAddress
    ? annualRewards.delegateToUserRewards?.[delegateAddress]
    : annualRewards.reward
  const annualFormatted =
    annualRewards.status === Status.Loading
      ? null
      : AudiusClient.displayShortAud(annual)

  const weekly =
    'reward' in weeklyRewards
      ? delegateAddress
        ? weeklyRewards.delegateToUserRewards?.[delegateAddress]
        : weeklyRewards.reward
      : null

  const weeklyFormatted =
    weeklyRewards.status === Status.Loading
      ? null
      : AudiusClient.displayShortAud(weekly)

  if (isLoading) {
    return null
  }

  return (
    <Flex mt="l" direction="column" gap="s">
      <Flex gap="s">
        <Text variant="heading" size="s" strength="default" tag="span">
          {weeklyFormatted}
        </Text>
        <Text variant="heading" color="subdued" size="s" strength="default">
          {messages.weekly}
        </Text>
      </Flex>
      <Flex gap="s">
        <Text variant="heading" size="s" strength="default" tag="span">
          {annualFormatted}
        </Text>
        <Text variant="heading" color="subdued" size="s" strength="default">
          {messages.annual}
        </Text>
      </Flex>
    </Flex>
  )
}

export const ManageAccountCard = () => {
  const { isLoggedIn, wallet } = useAccount()

  const { user, audiusProfile, status } = useUser({ wallet })
  const delegate = user?.delegates?.[0]

  const activeStake = user ? getActiveStake(user) : new BN('0')
  const activeStateFormatted = AudiusClient.displayShortAud(activeStake)

  if (!isLoggedIn || !wallet || !delegate) {
    return null
  }

  return (
    <>
      {user?.delegates?.map(d => {
        return (
          <Card
            pv="l"
            ph="xl"
            justifyContent="space-between"
            alignItems="center"
            gap="2xl"
          >
            <Card direction="column" pv="l" ph="xl">
              <Text
                variant="heading"
                color="subdued"
                size="s"
                strength="default"
              >
                {messages.delegatingTo}
              </Text>
              <Box mt="l">
                <DelegateInfo wallet={d.wallet} />
              </Box>
            </Card>
            <Box css={{ flexGrow: 1 }}>
              <Text
                variant="heading"
                color="subdued"
                size="s"
                strength="default"
              >
                {messages.estimatedReward}
              </Text>
              <Box mt="l">
                <UserAudioRewardEstimate
                  wallet={wallet}
                  delegateAddress={d.wallet}
                />
              </Box>
            </Box>
            <Box css={{ maxWidth: 226, flexGrow: 1 }}>
              <Flex direction="column" alignItems="flex-end">
                <Text
                  variant="heading"
                  size="m"
                  strength="default"
                  color="accent"
                >
                  {AudiusClient.displayShortAud(d.amount)}
                </Text>
                <Text
                  variant="heading"
                  color="subdued"
                  size="s"
                  strength="default"
                >
                  {messages.delegatedToken}
                </Text>
              </Flex>
              <Box mt="unit5">
                <Button
                  type={ButtonType.PRIMARY}
                  text={messages.manage}
                  css={{ width: '100%' }}
                />
              </Box>
            </Box>
          </Card>
        )
      })}
    </>
  )
}
