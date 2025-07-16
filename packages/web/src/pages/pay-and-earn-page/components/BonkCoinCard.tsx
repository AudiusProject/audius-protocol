import { useTokenBalance, useTokenPrice } from '@audius/common/api'
import { buySellMessages } from '@audius/common/messages'
import { Status } from '@audius/common/models'
import { BONK } from '@audius/fixed-decimal'
import { IconTokenBonk } from '@audius/harmony'

import { CoinCard } from './CoinCard'

const messages = {
  ...buySellMessages,
  bonkTicker: '$BONK'
}

const DIMENSIONS = 64
// TODO: use getTokenRegistry instead
const BONK_MINT = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'

export const BonkCoinCard = ({ onClick }: { onClick?: () => void }) => {
  const { data: bonkBalance, status: bonkBalanceStatus } = useTokenBalance({
    token: 'BONK'
  })
  const { data: bonkPriceData, isPending: isBonkPriceLoading } =
    useTokenPrice(BONK_MINT)

  const bonkBalanceFormatted = bonkBalance
    ? BONK(bonkBalance.toString()).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      })
    : ''
  const bonkDollarValue =
    bonkPriceData?.price && bonkBalance
      ? `$${(Number(bonkBalance.toString()) * Number(bonkPriceData.price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : ''
  const isLoading = bonkBalanceStatus === Status.LOADING || isBonkPriceLoading

  return (
    <CoinCard
      icon={<IconTokenBonk width={DIMENSIONS} height={DIMENSIONS} hex />}
      symbol={messages.bonkTicker}
      balance={bonkBalanceFormatted}
      dollarValue={bonkDollarValue}
      loading={isLoading}
      onClick={onClick}
    />
  )
}
