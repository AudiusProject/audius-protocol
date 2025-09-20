import { ReactNode } from 'react'

import { Flex, IconInfo, Text } from '@audius/harmony'

import { Tooltip } from 'components/tooltip'

type TokenInfoRowProps = {
  label: string
  value: string | ReactNode
  hasTooltip?: boolean
  tooltipContent?: string
}

export const TokenInfoRow = ({
  label,
  value,
  hasTooltip,
  tooltipContent
}: TokenInfoRowProps) => {
  const tooltipTrigger = (
    <Flex alignItems='center' gap='xs'>
      <Text variant='body' size='m' color='subdued'>
        {label}
      </Text>
      {hasTooltip && <IconInfo size='s' color='subdued' />}
    </Flex>
  )

  return (
    <Flex alignItems='center' justifyContent='space-between' w='100%'>
      {hasTooltip && tooltipContent ? (
        <Tooltip text={tooltipContent} mount='body'>
          {tooltipTrigger}
        </Tooltip>
      ) : (
        tooltipTrigger
      )}
      {typeof value === 'string' ? (
        <Text variant='body' size='m' color='default'>
          {value}
        </Text>
      ) : (
        value
      )}
    </Flex>
  )
}
