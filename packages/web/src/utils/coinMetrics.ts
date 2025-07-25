import { formatCount, getCurrencyDecimalPlaces } from '@audius/common/utils'
import { Coin } from '@audius/sdk'

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

const formatCurrency = (num: number): string => {
  if (num === 0) return '$0.00'

  try {
    const decimalPlaces = getCurrencyDecimalPlaces(num)
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: Math.min(decimalPlaces, 2),
      maximumFractionDigits: decimalPlaces
    }).format(num)

    return formatted
  } catch {
    return `$${num.toFixed(2)}`
  }
}

const formatPercentage = (num: number): string => {
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`
}

const createChangeData = (changePercent: number | undefined) => {
  if (
    changePercent === undefined ||
    changePercent === null ||
    isNaN(changePercent)
  ) {
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
  const potentialMetrics = [
    createMetric(
      formatCurrency(coin.tokenInfo.price),
      messages.pricePerCoin,
      coin.tokenInfo.priceChange24hPercent
    ),
    createMetric(
      formatCount(coin.members),
      messages.holdersOnAudius,
      coin.membersChange24hPercent
    ),
    createMetric(
      formatCount(coin.tokenInfo.uniqueWallet24h || 0),
      messages.uniqueHolders,
      coin.tokenInfo.uniqueWallet24hChangePercent
    ),
    createMetric(
      formatCurrency(coin.tokenInfo.v24hUSD),
      messages.volume24hr,
      coin.tokenInfo.v24hChangePercent
    ),
    createMetric(
      formatCount(coin.tokenInfo.trade24h),
      messages.totalTransfers,
      coin.tokenInfo.trade24hChangePercent
    )
  ]

  return potentialMetrics.filter(
    (metric): metric is MetricData => metric !== null
  )
}
