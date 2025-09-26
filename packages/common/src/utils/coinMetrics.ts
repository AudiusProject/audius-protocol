import { Coin } from '~/adapters/coin'

import { formatCurrencyWithSubscript, formatCount } from './decimal'

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
  marketCap: 'Market Cap',
  graduationProgress: 'Graduation Progress'
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
      formatCurrencyWithSubscript(coin.marketCap),
      messages.marketCap
    ),
    createMetric(
      formatCount(coin.holder),
      messages.uniqueHolders,
      (coin.uniqueWallet24h / Math.max(coin.holder - coin.uniqueWallet24h, 1)) *
        100
    ),
    createMetric(
      `${Math.round((coin.dynamicBondingCurve?.curveProgress ?? 0) * 100)}%`,
      messages.graduationProgress
    ),
    createMetric(
      `$${formatCount(coin.v24hUSD, 2)}`,
      messages.volume24hr,
      coin.v24hChangePercent
    ),
    createMetric(formatCount(coin.trade24h), messages.totalTransfers)
  ]

  return potentialMetrics.filter(
    (metric): metric is MetricData => metric !== null
  )
}
