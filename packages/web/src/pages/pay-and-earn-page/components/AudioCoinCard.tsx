import { useCallback } from 'react'

import { useFormattedAudioBalance } from '@audius/common/hooks'
import { buySellMessages } from '@audius/common/messages'
import { IconTokenAUDIO } from '@audius/harmony'
import { useDispatch } from 'react-redux'
import { push } from 'redux-first-history'

import { CoinCard } from './CoinCard'

const AUDIO_TICKER = buySellMessages.audioTicker

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
      symbol={buySellMessages.audioTicker}
      balance={audioBalanceFormatted ?? ''}
      dollarValue={audioDollarValue ?? ''}
      loading={isLoading}
      onClick={handleCoinClick}
    />
  )
}
