import { useMemo } from 'react'

import { AUDIO } from '@audius/fixed-decimal'

import { useTokenPrice } from '../api'
import { TOKEN_LISTING_MAP } from '../store'
import { formatWei, isNullOrUndefined } from '../utils'

import { useTotalBalanceWithFallback } from './useAudioBalance'

// AUDIO token address from Jupiter
const AUDIO_TOKEN_ID = TOKEN_LISTING_MAP.AUDIO.address

type UseFormattedAudioBalanceReturn = {
  audioBalance: ReturnType<typeof useTotalBalanceWithFallback>
  audioBalanceFormatted: string
  isAudioBalanceLoading: boolean
  audioPrice: string | null
  audioDollarValue: string
  isAudioPriceLoading: boolean
}

export const useFormattedAudioBalance = (): UseFormattedAudioBalanceReturn => {
  const audioBalance = useTotalBalanceWithFallback()
  const audioBalanceFormatted = formatWei(audioBalance, true, 0)
  const isAudioBalanceLoading = isNullOrUndefined(audioBalance)

  const { data: audioPriceData, isPending: isAudioPriceLoading } =
    useTokenPrice(AUDIO_TOKEN_ID)
  const audioPrice = audioPriceData?.price || null

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
