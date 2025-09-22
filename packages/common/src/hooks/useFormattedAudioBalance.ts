import { useMemo } from 'react'

import { AUDIO, FixedDecimal } from '@audius/fixed-decimal'

import { useArtistCoin, useAudioBalance, useQueryContext } from '~/api'
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
  const { env } = useQueryContext()
  const { totalBalance, isLoading: isAudioBalanceLoading } = useAudioBalance()

  const { data: audioPriceData, isPending: isAudioPriceLoading } =
    useArtistCoin(env.WAUDIO_MINT_ADDRESS)
  const audioPrice = audioPriceData?.price?.toString() ?? null
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
