import { useMemo } from 'react'

import { AUDIO } from '@audius/fixed-decimal'

import { useAudioBalance, useTokenPrice } from '../api'
import { TOKEN_LISTING_MAP } from '../store'
import { getCurrencyDecimalPlaces, isNullOrUndefined } from '../utils'

// AUDIO token address from Jupiter
const AUDIO_TOKEN_ID = TOKEN_LISTING_MAP.AUDIO.address

type UseFormattedAudioBalanceReturn = {
  audioBalance: bigint | null
  audioBalanceFormatted: string | null
  isAudioBalanceLoading: boolean
  audioPrice: string | null
  audioDollarValue: string
  isAudioPriceLoading: boolean
}

export const useFormattedAudioBalance = (): UseFormattedAudioBalanceReturn => {
  const { totalBalance, isLoading: isAudioBalanceLoading } = useAudioBalance()
  const { data: audioPriceData, isPending: isAudioPriceLoading } =
    useTokenPrice(AUDIO_TOKEN_ID)
  const audioPrice = audioPriceData?.price || null
  const hasFetchedAudioBalance = !isNullOrUndefined(totalBalance)
  const audioBalance = hasFetchedAudioBalance ? totalBalance : null

  const decimalPlaces = useMemo(() => {
    if (!audioPrice) return 2
    return getCurrencyDecimalPlaces(parseFloat(audioPrice))
  }, [audioPrice])

  const audioBalanceFormatted = hasFetchedAudioBalance
    ? AUDIO(totalBalance).toLocaleString('en-US', {
        maximumFractionDigits: decimalPlaces
      })
    : null

  // Calculate dollar value of user's AUDIO balance
  const audioDollarValue = useMemo(() => {
    if (!audioPrice || !audioBalance) return '$0.00'

    const priceNumber = parseFloat(audioPrice)
    const balanceValue = parseFloat(AUDIO(audioBalance).toString())
    const totalValue = priceNumber * balanceValue

    return `$${totalValue.toFixed(2)} ($${parseFloat(audioPrice).toFixed(4)})`
  }, [audioBalance, audioPrice])

  return {
    audioBalance,
    audioBalanceFormatted,
    isAudioBalanceLoading,
    audioPrice,
    audioDollarValue,
    isAudioPriceLoading
  }
}
