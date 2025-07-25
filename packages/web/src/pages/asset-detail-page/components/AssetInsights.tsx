import { useArtistCoin } from '@audius/common/api'
import { Flex, IconCaretDown, IconCaretUp, Paper, Text } from '@audius/harmony'

import { componentWithErrorBoundary } from '../../../components/error-wrapper/componentWithErrorBoundary'
import { createCoinMetrics, MetricData } from '../../../utils/coinMetrics'
import { AssetDetailProps } from '../types'

const messages = {
  title: 'Insights',
  pricePerCoin: 'Price per coin',
  holdersOnAudius: 'Holders on Audius',
  uniqueHolders: 'Unique Holders',
  volume24hr: 'Volume (24hr)',
  totalTransfers: 'Total Transfers'
}

const MetricRowComponent = ({ metric }: { metric: MetricData }) => {
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

const MetricRow = componentWithErrorBoundary(MetricRowComponent, {
  fallback: null,
  name: 'MetricRow'
})

export const AssetInsights = ({ mint }: AssetDetailProps) => {
  const { data: coin, isLoading, error } = useArtistCoin({ mint })

  if (isLoading || !coin || !coin.tokenInfo) {
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

  if (error || !coin) {
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

  const metrics = createCoinMetrics(coin)

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
