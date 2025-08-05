import { useCoinInsights } from '@audius/common/api'
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

// Helper function to format numbers
const formatNumber = (num: number): string => {
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(1)}B`
  }
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(1)}M`
  }
  if (num >= 1e3) {
    return `${(num / 1e3).toFixed(1)}K`
  }
  return num.toLocaleString()
}

// Helper function to format currency
const formatCurrency = (num: number): string => {
  if (num >= 1) {
    return `$${num.toFixed(2)}`
  }
  if (num >= 0.01) {
    return `$${num.toFixed(4)}`
  }
  return `$${num.toExponential(2)}`
}

// Helper function to format percentage
const formatPercentage = (num: number): string => {
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`
}

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

export const AssetInsights = ({ assetName }: AssetDetailProps) => {
  const {
    data: insights,
    isLoading,
    error
  } = useCoinInsights({ mint: assetName })

  if (isLoading) {
    return (
      <Paper
        direction='column'
        alignItems='flex-start'
        backgroundColor='white'
        borderRadius='m'
        border='default'
      >
        <Flex
          direction='row'
          alignItems='center'
          gap='xs'
          pv='m'
          ph='l'
          w='100%'
        >
          <Text variant='heading' size='s' color='heading'>
            {messages.title}
          </Text>
        </Flex>
        <Flex pv='xl' ph='l' w='100%' justifyContent='center'>
          <Text variant='body' color='subdued'>
            Loading insights...
          </Text>
        </Flex>
      </Paper>
    )
  }

  if (error || !insights) {
    return (
      <Paper
        direction='column'
        alignItems='flex-start'
        backgroundColor='white'
        borderRadius='m'
        border='default'
      >
        <Flex
          direction='row'
          alignItems='center'
          gap='xs'
          pv='m'
          ph='l'
          w='100%'
        >
          <Text variant='heading' size='s' color='heading'>
            {messages.title}
          </Text>
        </Flex>
        <Flex pv='xl' ph='l' w='100%' justifyContent='center'>
          <Text variant='body' color='subdued'>
            Unable to load insights
          </Text>
        </Flex>
      </Paper>
    )
  }

  const metrics: MetricData[] = [
    {
      value: formatCurrency(insights.price),
      label: messages.pricePerCoin,
      change: {
        value: formatPercentage(insights.priceChange24hPercent),
        isPositive: insights.priceChange24hPercent >= 0
      }
    },
    {
      value: formatNumber(insights.members),
      label: messages.holdersOnAudius,
      change: {
        value: formatPercentage(insights.membersChange24hPercent),
        isPositive: insights.membersChange24hPercent >= 0
      }
    },
    {
      value: formatNumber(insights.uniqueWallet24h || 0),
      label: messages.uniqueHolders,
      change: {
        value: formatPercentage(insights.uniqueWallet24hChangePercent),
        isPositive: insights.uniqueWallet24hChangePercent >= 0
      }
    },
    {
      value: formatCurrency(insights.v24hUSD),
      label: messages.volume24hr,
      change: {
        value: formatPercentage(insights.v24hChangePercent || 0),
        isPositive: (insights.v24hChangePercent || 0) >= 0
      }
    },
    {
      value: formatNumber(insights.trade24h),
      label: messages.totalTransfers,
      change: {
        value: formatPercentage(insights.trade24hChangePercent),
        isPositive: insights.trade24hChangePercent >= 0
      }
    }
  ]

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

      {metrics.map((metric) => (
        <MetricRow key={metric.label} metric={metric} />
      ))}
    </Paper>
  )
}
