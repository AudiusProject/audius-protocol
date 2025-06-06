import {
  useUSDCBalance,
  selectIsAccountComplete,
  useCurrentAccountUser,
  useCurrentUserId
} from '@audius/common/api'
import { useTotalBalanceWithFallback } from '@audius/common/hooks'
import { BNUSDC } from '@audius/common/models'
import { useTierAndVerifiedForUser } from '@audius/common/store'
import {
  formatCount,
  formatUSDCWeiToFloorCentsNumber,
  route
} from '@audius/common/utils'
import { AUDIO } from '@audius/fixed-decimal'
import {
  BalancePill,
  Flex,
  Text,
  IconLogoCircleUSDCPng,
  IconTokenBronze,
  IconTokenSilver,
  IconTokenGold,
  IconTokenPlatinum,
  IconTokenNoTier
} from '@audius/harmony'
import BN from 'bn.js'

import { useIsUSDCEnabled } from 'hooks/useIsUSDCEnabled'

import { LeftNavLink } from './LeftNavLink'

const { AUDIO_PAGE, PAYMENTS_PAGE } = route

const messages = {
  audio: '$AUDIO',
  usdc: 'USDC'
}

export const WalletsNestedContent = () => {
  const { data: isAccountComplete = false } = useCurrentAccountUser({
    select: selectIsAccountComplete
  })
  const isUSDCEnabled = useIsUSDCEnabled()
  const { data: usdcBalance } = useUSDCBalance()
  const audioBalance = useTotalBalanceWithFallback()
  const { data: userId } = useCurrentUserId()
  const { tier } = useTierAndVerifiedForUser(userId ?? 0)
  const usdcCentBalance =
    formatUSDCWeiToFloorCentsNumber((usdcBalance ?? new BN(0)) as BNUSDC) / 100

  const TierIcon = {
    none: IconTokenNoTier,
    bronze: IconTokenBronze,
    silver: IconTokenSilver,
    gold: IconTokenGold,
    platinum: IconTokenPlatinum
  }[tier]

  const audioBalanceFormatted = audioBalance
    ? AUDIO(audioBalance).toLocaleString()
    : null

  const usdcBalanceFormatted = usdcBalance ? formatCount(usdcCentBalance) : '0'

  return (
    <Flex direction='column'>
      <LeftNavLink
        to={AUDIO_PAGE}
        rightIcon={
          <BalancePill balance={audioBalanceFormatted}>
            <TierIcon size='l' />
          </BalancePill>
        }
        restriction='account'
        disabled={!isAccountComplete}
        textSize='m'
      >
        <Flex pl='s'>
          <Text>{messages.audio}</Text>
        </Flex>
      </LeftNavLink>
      {isUSDCEnabled ? (
        <LeftNavLink
          to={PAYMENTS_PAGE}
          rightIcon={
            <BalancePill balance={usdcBalanceFormatted}>
              <IconLogoCircleUSDCPng />
            </BalancePill>
          }
          restriction='account'
          disabled={!isAccountComplete}
          textSize='m'
        >
          <Flex pl='s'>
            <Text>{messages.usdc}</Text>
          </Flex>
        </LeftNavLink>
      ) : null}
    </Flex>
  )
}
