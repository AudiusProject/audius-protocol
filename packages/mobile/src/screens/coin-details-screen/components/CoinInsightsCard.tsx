import { useArtistCoin } from '@audius/common/api'
import { coinDetailsMessages } from '@audius/common/messages'
import { createCoinMetrics, type MetricData } from '@audius/common/utils'

import {
  Flex,
  IconCaretDown,
  IconCaretUp,
  IconButton,
  Paper,
  Text,
  IconKebabHorizontal
} from '@audius/harmony-native'
import { useDrawer } from 'app/hooks/useDrawer'

const messages = coinDetailsMessages.coinInsights

const MetricRow = ({ metric }: { metric: MetricData }) => {
  const changeColor = metric.change?.isPositive ? 'premium' : 'danger'

  return (
    <Flex
      row
      alignItems='flex-start'
      justifyContent='space-between'
      borderTop='default'
      pv='m'
      ph='l'
      w='100%'
    >
      <Flex column alignItems='flex-start' flex={1}>
        <Text variant='heading' size='xl'>
          {metric.value}
        </Text>
        <Text variant='title' size='m' color='subdued'>
          {metric.label}
        </Text>
      </Flex>

      {metric.change ? (
        <Flex row alignItems='center' gap='xs'>
          <Text
            variant='label'
            size='s'
            color={changeColor}
            style={{ textTransform: 'uppercase' }}
          >
            {metric.change.value}
          </Text>
          <Flex row>
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

export const CoinInsightsCard = ({ mint }: { mint: string }) => {
  const { data: coin, isPending, error } = useArtistCoin(mint)

  const { onOpen } = useDrawer('AssetInsightsOverflowMenu')

  const handleOpenOverflowMenu = () => {
    onOpen({ mint })
  }

  if (isPending || !coin) {
    return null
  }

  const metrics = createCoinMetrics(coin)

  return (
    <Paper
      column
      alignItems='flex-start'
      backgroundColor='white'
      borderRadius='l'
      shadow='far'
      border='default'
    >
      <Flex
        row
        alignItems='center'
        justifyContent='space-between'
        pv='m'
        ph='l'
        w='100%'
      >
        <Text variant='heading' size='s' color='heading'>
          {messages.title}
        </Text>
        <IconButton
          icon={IconKebabHorizontal}
          onPress={handleOpenOverflowMenu}
          ripple
        />
      </Flex>

      {error || !coin ? (
        <Flex pv='xl' ph='l' w='100%' justifyContent='center'>
          <Text variant='body' color='subdued'>
            Unable to load insights
          </Text>
        </Flex>
      ) : (
        metrics.map((metric) => (
          <MetricRow key={metric.label} metric={metric} />
        ))
      )}
    </Paper>
  )
}
