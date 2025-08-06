import { useMemo } from 'react'

import { AUDIO, FixedDecimal } from '@audius/fixed-decimal'

import { useAudioBalance, useTokenPrice } from '~/api'
import { TOKEN_LISTING_MAP } from '~/store/ui/buy-audio/constants'
import { formatAudioBalance, isNullOrUndefined } from '~/utils'

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

  // AUDIO token address from Jupiter
  const AUDIO_TOKEN_ID = TOKEN_LISTING_MAP.AUDIO.address

  const { data: audioPriceData, isPending: isAudioPriceLoading } =
    useTokenPrice(AUDIO_TOKEN_ID)
  const audioPrice = audioPriceData?.price || null
  const hasFetchedAudioBalance = !isNullOrUndefined(totalBalance)
  const audioBalance = hasFetchedAudioBalance ? totalBalance : null

  // Format AUDIO balance with dynamic decimal places (minimum 2)
  const audioBalanceFormatted = hasFetchedAudioBalance
    ? formatAudioBalance(totalBalance)
    : null

  // Calculate dollar value of user's AUDIO balance
  const audioDollarValue = useMemo(() => {
    if (!audioPrice || !audioBalance) return '$0.00'

    const priceNumber = Number(new FixedDecimal(audioPrice).toString())
    const balanceValue = Number(AUDIO(audioBalance).toString())
    const totalValue = priceNumber * balanceValue

    return `$${totalValue.toFixed(2)} ($${Number(new FixedDecimal(audioPrice).toString()).toFixed(4)})`
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
