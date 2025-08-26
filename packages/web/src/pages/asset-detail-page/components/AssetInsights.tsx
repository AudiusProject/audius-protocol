import { useArtistCoinInsights } from '@audius/common/api'
import { coinDetailsMessages } from '@audius/common/messages'
import { createCoinMetrics, MetricData } from '@audius/common/utils'
import { Flex, IconCaretDown, IconCaretUp, Paper, Text } from '@audius/harmony'

import { componentWithErrorBoundary } from '../../../components/error-wrapper/componentWithErrorBoundary'
import Skeleton from '../../../components/skeleton/Skeleton'

const messages = coinDetailsMessages.coinInsights

const AssetInsightsSkeleton = () => {
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

      {/* Skeleton for 5 metric rows */}
      {Array.from({ length: 5 }).map((_, index) => (
        <Flex
          key={index}
          direction='row'
          alignItems='flex-start'
          justifyContent='space-between'
          borderTop='default'
          pv='l'
          ph='l'
          w='100%'
        >
          <Flex column alignItems='flex-start' gap='l' flex={1}>
            <Skeleton width='80px' height='32px' />
            <Skeleton width='120px' height='20px' />
          </Flex>
          <Flex row alignItems='center' gap='xs'>
            <Skeleton width='60px' height='16px' />
            <Skeleton width='16px' height='16px' />
          </Flex>
        </Flex>
      ))}
    </Paper>
  )
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

type AssetInsightsProps = {
  mint: string
}

export const AssetInsights = ({ mint }: AssetInsightsProps) => {
  const {
    data: coinInsights,
    isPending,
    error
  } = useArtistCoinInsights({ mint })

  if (isPending || !coinInsights) {
    return <AssetInsightsSkeleton />
  }

  if (error || !coinInsights) {
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

  const metrics = createCoinMetrics(coinInsights)

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
