import { Coin } from '@audius/sdk'

import { formatCurrencyWithMax, formatCurrencyWithSubscript } from './decimal'
import { formatCount } from './formatUtil'

export type MetricData = {
  value: string
  label: string
  change?: {
    value: string
    isPositive: boolean
  }
}

const messages = {
  pricePerCoin: 'Price',
  holdersOnAudius: 'Holders on Audius',
  uniqueHolders: 'Unique Holders',
  volume24hr: 'Volume (24hr)',
  totalTransfers: 'Total Transfers',
  graduationProgress: 'Graduation Progress'
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

export const createCoinMetrics = (coin: Coin): MetricData[] => {
  // Birdeye price may not be available right after launch. Fall back to dynamic bonding curve price if so.
  const price =
    coin.price === 0 ? coin.dynamicBondingCurve.priceUSD : coin.price
  const potentialMetrics = [
    createMetric(
      formatCurrencyWithSubscript(price),
      messages.pricePerCoin,
      coin.priceChange24hPercent
    ),
    createMetric(
      formatCount(coin.holder),
      messages.uniqueHolders,
      coin.uniqueWallet24hChangePercent
    ),
    createMetric(
      `${Math.round((coin.dynamicBondingCurve?.curveProgress ?? 0) * 100)}%`,
      messages.graduationProgress
    ),
    createMetric(
      formatCurrencyWithMax(coin.v24hUSD, CURRENCY_FORMAT_MAX),
      messages.volume24hr,
      coin.v24hChangePercent
    ),
    createMetric(
      formatCount(coin.trade24h),
      messages.totalTransfers,
      coin.trade24hChangePercent
    )
  ]

  return potentialMetrics.filter(
    (metric): metric is MetricData => metric !== null
  )
}
