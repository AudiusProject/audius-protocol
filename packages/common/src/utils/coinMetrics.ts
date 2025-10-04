import { Coin } from '~/adapters/coin'
import type { CoinGeckoCoinResponse } from '~/api'

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
  totalTransfers: 'Transfers (24hr)',
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
  // Birdeye data may not be available right after launch.
  // Fall back to dynamic bonding curve data if so.
  const defaultSupply = 1e9

  const hasBirdeyeSupply =
    coin.totalSupply !== undefined && coin.totalSupply > 0
  const hasBirdeyePrice = coin.price !== undefined && coin.price > 0

  // For price, use the bonding curve price if the coin hasn't graduated or we have no birdeye data
  const price =
    !coin.dynamicBondingCurve.isMigrated || !hasBirdeyePrice
      ? coin.dynamicBondingCurve.priceUSD
      : coin.price

  // For market cap, use the bonding curve market cap if the coin hasn't graduated or we have no birdeye data
  const marketCap =
    !coin.dynamicBondingCurve.isMigrated || !hasBirdeyeSupply
      ? price * (hasBirdeyeSupply ? coin.totalSupply : defaultSupply)
      : coin.marketCap

  const potentialMetrics = [
    createMetric(
      formatCurrencyWithSubscript(price),
      messages.pricePerCoin,
      coin.priceChange24hPercent
    ),
    createMetric(`$${formatCount(marketCap, 2)}`, messages.marketCap),
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

export const createAudioCoinMetrics = (
  coingeckoResponse?: CoinGeckoCoinResponse
) => {
  if (coingeckoResponse === null || coingeckoResponse === undefined) {
    return []
  }
  return [
    createMetric(
      formatCurrencyWithSubscript(
        coingeckoResponse.market_data.current_price.usd
      ),
      messages.pricePerCoin,
      coingeckoResponse.market_data.price_change_percentage_24h
    ),
    createMetric(
      `$${formatCount(coingeckoResponse.market_data.market_cap.usd, 2)}`,
      messages.marketCap
    ),
    createMetric(
      `$${formatCount(coingeckoResponse.market_data.total_volume.usd, 2)}`,
      messages.volume24hr
    )
  ].filter((metric): metric is MetricData => metric !== null)
}
