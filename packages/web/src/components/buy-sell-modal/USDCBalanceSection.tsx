import { TokenInfo } from '@audius/common/store'
import { Divider, Flex, Text, IconLogoCircleUSDC } from '@audius/harmony'
import { TooltipPlacement } from 'antd/lib/tooltip'

import { env } from 'services/env'

import { TooltipInfoIcon } from './TooltipInfoIcon'

const messages = {
  amount: (amount: string) => `$${amount}`
}

type USDCBalanceSectionProps = {
  title: string
  tokenInfo: TokenInfo
  amount: string
  tooltipPlacement?: TooltipPlacement
  hideTooltip?: boolean
}

export const USDCBalanceSection = ({
  title,
  tokenInfo,
  amount,
  tooltipPlacement,
  hideTooltip
}: USDCBalanceSectionProps) => {
  const isUsdc = tokenInfo.address === env.USDC_MINT_ADDRESS
  return (
    <Flex direction='column' gap='l'>
      <Flex alignItems='center' gap='s'>
        <Flex h='l' w='l' alignItems='center' justifyContent='center'>
          {isUsdc ? (
            <IconLogoCircleUSDC size='s' />
          ) : tokenInfo.icon ? (
            <tokenInfo.icon size='s' />
          ) : null}
        </Flex>
        <Text variant='heading' size='s' color='subdued'>
          {title}
        </Text>
        {!hideTooltip ? <TooltipInfoIcon placement={tooltipPlacement} /> : null}
        <Divider css={{ flexGrow: 1 }} />
      </Flex>
      <Text variant='heading' size='xl'>
        {messages.amount(amount)}
      </Text>
    </Flex>
  )
}
