import {
  useUSDCBalance,
  useTotalBalanceWithFallback
} from '@audius/common/hooks'
import { BNUSDC } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import {
  formatWei,
  formatUSDCWeiToFloorCentsNumber,
  route
} from '@audius/common/utils'
import {
  BalancePill,
  Flex,
  IconLogoCircle,
  IconLogoCircleUSDC
} from '@audius/harmony'
import BN from 'bn.js'
import { useSelector } from 'react-redux'

import { useIsUSDCEnabled } from 'hooks/useIsUSDCEnabled'

import { LeftNavLink } from './LeftNavLink'

const { AUDIO_PAGE, PAYMENTS_PAGE } = route
const { getIsAccountComplete } = accountSelectors

export const WalletsNestedContent = () => {
  const isAccountComplete = useSelector(getIsAccountComplete)
  const isUSDCEnabled = useIsUSDCEnabled()
  const { data: usdcBalance } = useUSDCBalance()
  const audioBalance = useTotalBalanceWithFallback()

  return (
    <Flex direction='column'>
      <LeftNavLink
        to={AUDIO_PAGE}
        rightIcon={
          <BalancePill
            balance={audioBalance ? formatWei(audioBalance, true, 0) : '0'}
          >
            <IconLogoCircle />
          </BalancePill>
        }
        restriction='account'
        disabled={!isAccountComplete}
        textSize='m'
      >
        $AUDIO
      </LeftNavLink>
      {isUSDCEnabled ? (
        <LeftNavLink
          to={PAYMENTS_PAGE}
          rightIcon={
            <BalancePill
              balance={
                formatUSDCWeiToFloorCentsNumber(
                  (usdcBalance ?? new BN(0)) as BNUSDC
                ) / 100
              }
            >
              <IconLogoCircleUSDC />
            </BalancePill>
          }
          restriction='account'
          disabled={!isAccountComplete}
          textSize='m'
        >
          USDC
        </LeftNavLink>
      ) : null}
    </Flex>
  )
}
