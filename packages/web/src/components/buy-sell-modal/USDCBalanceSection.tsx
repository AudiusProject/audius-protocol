import { Divider, Flex, IconInfo, Text } from '@audius/harmony'

import { TokenInfo } from './types'

const messages = {
  amount: (amount: string) => `$${amount}`
}

type USDCBalanceSectionProps = {
  title: string
  tokenInfo: TokenInfo
  amount: string
}

export const USDCBalanceSection = ({
  title,
  tokenInfo,
  amount
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
        <IconInfo size='s' color='subdued' />
        <Divider css={{ flexGrow: 1 }} />
      </Flex>
      <Text variant='heading' size='xl'>
        {messages.amount(amount)}
      </Text>
    </Flex>
  )
}
