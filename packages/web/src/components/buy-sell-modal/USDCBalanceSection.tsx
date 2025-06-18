import { TokenInfo } from '@audius/common/store'
import { Divider, Flex, Text } from '@audius/harmony'
import { TooltipPlacement } from 'antd/lib/tooltip'

import { TooltipInfoIcon } from './TooltipInfoIcon'

const messages = {
  amount: (amount: string) => `$${amount}`
}

type USDCBalanceSectionProps = {
  title: string
  tokenInfo: TokenInfo
  amount: string
  tooltipPlacement?: TooltipPlacement
}

export const USDCBalanceSection = ({
  title,
  tokenInfo,
  amount,
  tooltipPlacement
}: USDCBalanceSectionProps) => {
  return (
    <Flex direction='column' gap='l'>
      <Flex alignItems='center' gap='s'>
        <Flex h='l' w='l' alignItems='center' justifyContent='center'>
          {tokenInfo.icon ? <tokenInfo.icon size='s' /> : null}
        </Flex>
        <Text variant='heading' size='s' color='subdued'>
          {title}
        </Text>
        <TooltipInfoIcon placement={tooltipPlacement} />
        <Divider css={{ flexGrow: 1 }} />
      </Flex>
      <Text variant='heading' size='xl'>
        {messages.amount(amount)}
      </Text>
    </Flex>
  )
}
