import { walletMessages } from '@audius/common/messages'
import { BNUSDC } from '@audius/common/models'
import { USDC } from '@audius/fixed-decimal'
import {
  Flex,
  IconLogoCircleUSDC,
  Text,
  IconButton,
  IconInfo
} from '@audius/harmony'
import BN from 'bn.js'

import Tooltip from 'components/tooltip/Tooltip'

type CashBalanceSectionProps = {
  balance: BNUSDC | null
}

export const CashBalanceSection = ({ balance }: CashBalanceSectionProps) => {
  const formattedBalance = USDC(balance ?? new BN(0)).value

  return (
    <Flex column gap='s'>
      <Flex alignItems='center' justifyContent='space-between'>
        <Flex alignItems='center' gap='s'>
          <IconLogoCircleUSDC />
          <Text variant='heading' size='s' color='subdued'>
            {walletMessages.cashBalance}
          </Text>
          <Tooltip
            text={walletMessages.cashBalanceTooltip}
            placement='top'
            getPopupContainer={() =>
              document.getElementById('page') ?? document.body
            }
            shouldWrapContent={false}
            shouldDismissOnClick={false}
          >
            <IconButton
              icon={IconInfo}
              size='s'
              color='subdued'
              activeColor='default'
              aria-label='Cash balance information'
            />
          </Tooltip>
        </Flex>
      </Flex>
      <Text variant='display'>{USDC(formattedBalance).toLocaleString()}</Text>
    </Flex>
  )
}
