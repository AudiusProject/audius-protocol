import { useFormattedAudioBalance } from '@audius/common/hooks'
import { buySellMessages } from '@audius/common/messages'
import { IconTokenAUDIO } from '@audius/harmony'

import { CoinCard } from './CoinCard'

const DIMENSIONS = 64

export const AudioCoinCard = ({ onClick }: { onClick?: () => void }) => {
  const {
    audioBalanceFormatted,
    audioDollarValue,
    isAudioBalanceLoading,
    isAudioPriceLoading
  } = useFormattedAudioBalance()

  const isLoading = isAudioBalanceLoading || isAudioPriceLoading

  return (
    <CoinCard
      icon={<IconTokenAUDIO width={DIMENSIONS} height={DIMENSIONS} hex />}
      symbol={buySellMessages.audioTicker}
      balance={audioBalanceFormatted ?? ''}
      dollarValue={audioDollarValue ?? ''}
      loading={isLoading}
      onClick={onClick}
    />
  )
}
