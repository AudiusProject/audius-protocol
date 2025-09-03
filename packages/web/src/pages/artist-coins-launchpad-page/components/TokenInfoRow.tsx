import { Flex, IconInfo, Text } from '@audius/harmony'

import type { TokenInfoRowProps } from './types'

export const TokenInfoRow = ({
  label,
  value,
  hasTooltip
}: TokenInfoRowProps) => {
  return (
    <Flex alignItems='center' justifyContent='space-between' w='100%'>
      <Flex alignItems='center' gap='xs'>
        <Text variant='body' size='m' color='subdued'>
          {label}
        </Text>
        {hasTooltip && <IconInfo size='s' color='subdued' />}
      </Flex>
      <Text variant='body' size='m' color='default'>
        {value}
      </Text>
    </Flex>
  )
}
