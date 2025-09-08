import { useCallback } from 'react'

import { useFormattedAudioBalance } from '@audius/common/hooks'
import { AUDIO_TICKER } from '@audius/common/store'
import { IconTokenAUDIO } from '@audius/harmony'
import { useDispatch } from 'react-redux'
import { push } from 'redux-first-history'

import { CoinCard } from './CoinCard'

const DIMENSIONS = 64

export const AudioCoinCard = () => {
  const dispatch = useDispatch()

  const {
    audioBalanceFormatted,
    audioDollarValue,
    isAudioBalanceLoading,
    isAudioPriceLoading
  } = useFormattedAudioBalance()

  const isLoading = isAudioBalanceLoading || isAudioPriceLoading

  const handleCoinClick = useCallback(() => {
    dispatch(push(`/wallet/${AUDIO_TICKER}`))
  }, [dispatch])

  return (
    <CoinCard
      icon={<IconTokenAUDIO width={DIMENSIONS} height={DIMENSIONS} hex />}
      symbol={AUDIO_TICKER}
      balance={audioBalanceFormatted ?? ''}
      dollarValue={audioDollarValue ?? ''}
      loading={isLoading}
      onClick={handleCoinClick}
    />
  )
}
