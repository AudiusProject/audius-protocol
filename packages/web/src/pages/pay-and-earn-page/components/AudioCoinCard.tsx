import { useCallback } from 'react'

import { useFormattedAudioBalance } from '@audius/common/hooks'
import { buySellMessages } from '@audius/common/messages'
import { IconTokenAUDIO } from '@audius/harmony'
import { useDispatch } from 'react-redux'
import { push } from 'redux-first-history'

import { env } from 'services/env'

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

  const handleCoinClick = useCallback(
    (mint: string) => {
      dispatch(push(`/wallet/${mint}`))
    },
    [dispatch]
  )

  return (
    <CoinCard
      icon={<IconTokenAUDIO width={DIMENSIONS} height={DIMENSIONS} hex />}
      symbol={buySellMessages.audioTicker}
      balance={audioBalanceFormatted ?? ''}
      dollarValue={audioDollarValue ?? ''}
      loading={isLoading}
      onClick={() => handleCoinClick(env.WAUDIO_MINT_ADDRESS)}
    />
  )
}
