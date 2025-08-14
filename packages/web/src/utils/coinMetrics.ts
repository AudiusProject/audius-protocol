import { formatCount, formatCurrencyWithMax } from '@audius/common/utils'
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

const CURRENCY_FORMAT_MAX = 100_000

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
      formatCurrencyWithMax(coinInsights.price, CURRENCY_FORMAT_MAX),
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
      formatCurrencyWithMax(coinInsights.v24hUSD, CURRENCY_FORMAT_MAX),
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
