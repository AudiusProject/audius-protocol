import { Flex, IconCaretDown, IconCaretUp, Paper, Text } from '@audius/harmony'

import { AssetDetailProps } from '../types'

const messages = {
  title: 'Insights',
  pricePerCoin: 'Price per coin',
  holdersOnAudius: 'Holders on Audius',
  uniqueHolders: 'Unique Holders',
  volume24hr: 'Volume (24hr)',
  totalTransfers: 'Total Transfers'
}

type MetricData = {
  value: string
  label: string
  change?: {
    value: string
    isPositive: boolean
  }
}

const MOCK_METRICS: MetricData[] = [
  {
    value: '$0.082',
    label: messages.pricePerCoin,
    change: {
      value: '0.005',
      isPositive: false
    }
  },
  {
    value: '12.6K',
    label: messages.holdersOnAudius,
    change: {
      value: '0.5%',
      isPositive: true
    }
  },
  {
    value: '37.7K',
    label: messages.uniqueHolders,
    change: {
      value: '0.01%',
      isPositive: true
    }
  },
  {
    value: '5.9M',
    label: messages.volume24hr,
    change: {
      value: '1.68%',
      isPositive: true
    }
  },
  {
    value: '514K',
    label: messages.totalTransfers
  }
]

const MetricRow = ({ metric }: { metric: MetricData }) => {
  const changeColor = metric.change?.isPositive ? 'premium' : 'danger'

  return (
    <Flex
      direction='row'
      alignItems='flex-start'
      justifyContent='space-between'
      borderTop='default'
      pv='m'
      ph='l'
      w='100%'
    >
      <Flex direction='column' alignItems='flex-start' gap='xs' flex={1}>
        <Text variant='heading' size='xl'>
          {metric.value}
        </Text>
        <Text variant='title' size='m' color='subdued'>
          {metric.label}
        </Text>
      </Flex>

      {metric.change ? (
        <Flex direction='row' alignItems='center' gap='xs'>
          <Text
            variant='label'
            size='s'
            color={changeColor}
            css={{ textTransform: 'uppercase' }}
          >
            {metric.change.value}
          </Text>
          <Flex
            css={{
              color: changeColor
            }}
          >
            {metric.change.isPositive ? (
              <IconCaretUp size='s' color='premium' />
            ) : (
              <IconCaretDown size='s' color='danger' />
            )}
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  )
}

export const AssetInsights = ({ mint: _mint }: AssetDetailProps) => {
  return (
    <Paper
      direction='column'
      alignItems='flex-start'
      backgroundColor='white'
      borderRadius='m'
      border='default'
    >
      <Flex direction='row' alignItems='center' gap='xs' pv='m' ph='l' w='100%'>
        <Text variant='heading' size='s' color='heading'>
          {messages.title}
        </Text>
      </Flex>

      {MOCK_METRICS.map((metric) => (
        <MetricRow key={metric.label} metric={metric} />
      ))}
    </Paper>
  )
}
