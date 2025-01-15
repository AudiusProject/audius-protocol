import {
  useUSDCBalance,
  useTotalBalanceWithFallback,
  useSelectTierInfo
} from '@audius/common/hooks'
import { BNUSDC } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import {
  formatWei,
  formatUSDCWeiToFloorCentsNumber,
  route,
  formatCount
} from '@audius/common/utils'
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
import { useSelector } from 'react-redux'

import { useIsUSDCEnabled } from 'hooks/useIsUSDCEnabled'

import { LeftNavLink } from './LeftNavLink'

const { AUDIO_PAGE, PAYMENTS_PAGE } = route
const { getIsAccountComplete, getUserId } = accountSelectors

const messages = {
  audio: '$AUDIO',
  usdc: 'USDC'
}

export const WalletsNestedContent = () => {
  const isAccountComplete = useSelector(getIsAccountComplete)
  const isUSDCEnabled = useIsUSDCEnabled()
  const { data: usdcBalance } = useUSDCBalance()
  const audioBalance = useTotalBalanceWithFallback()
  const userId = useSelector(getUserId)
  const { tier } = useSelectTierInfo(userId ?? 0)
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
    ? formatCount(parseFloat(formatWei(audioBalance, true, 0)))
    : '0'

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
