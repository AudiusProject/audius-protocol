import { formatCount, formatCurrency } from '@audius/common/utils'
import { CoinInsights } from '@audius/sdk'

export type MetricData = {
  value: string
  label: string
  change?: {
    value: string
    isPositive: boolean
  }
}

const messages = {
  pricePerCoin: 'Price per coin',
  holdersOnAudius: 'Holders on Audius',
  uniqueHolders: 'Unique Holders',
  volume24hr: 'Volume (24hr)',
  totalTransfers: 'Total Transfers'
}

const formatPercentage = (num: number): string => {
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`
}

const createChangeData = (changePercent: number | undefined) => {
  if (!changePercent || isNaN(changePercent)) {
    return undefined
  }
  return {
    value: formatPercentage(changePercent),
    isPositive: changePercent >= 0
  }
}

const createMetric = (
  value: string,
  label: string,
  changePercent?: number
): MetricData | null => {
  try {
    return {
      value,
      label,
      change: createChangeData(changePercent)
    }
  } catch {
    return null
  }
}

export const createCoinMetrics = (coinInsights: CoinInsights): MetricData[] => {
  const potentialMetrics = [
    createMetric(
      formatCurrency(coinInsights.price),
      messages.pricePerCoin,
      coinInsights.priceChange24hPercent
    ),
    createMetric(
      formatCount(coinInsights.members),
      messages.holdersOnAudius,
      coinInsights.membersChange24hPercent
    ),
    createMetric(
      formatCount(coinInsights.holder || 0),
      messages.uniqueHolders,
      coinInsights.uniqueWallet24hChangePercent
    ),
    createMetric(
      formatCurrency(coinInsights.v24hUSD),
      messages.volume24hr,
      coinInsights.v24hChangePercent
    ),
    createMetric(
      formatCount(coinInsights.trade24h),
      messages.totalTransfers,
      coinInsights.trade24hChangePercent
    )
  ]

  return potentialMetrics.filter(
    (metric): metric is MetricData => metric !== null
  )
}
