import { useArtistCoin } from '@audius/common/api'
import { ASSET_DETAIL_PAGE } from '@audius/common/src/utils/route'
import { useBuySellModal } from '@audius/common/store'
import { Button, Flex, Paper, Text } from '@audius/harmony'
import { useDispatch } from 'react-redux'
import { push } from 'redux-first-history'

import { TokenIcon } from 'components/buy-sell-modal/TokenIcon'

const messages = {
  cardBody: 'Unlock exclusive perks & more.',
  buyCoins: 'Buy Coins'
}

export const BuyArtistCoinCard = ({ mint }: { mint: string }) => {
  const { data: artistCoin, isLoading } = useArtistCoin(mint)
  const { onOpen: openBuySellModal } = useBuySellModal()
  const dispatch = useDispatch()

  const handleBuyCoins = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering Paper's onClick
    openBuySellModal()
  }

  const handleCardClick = () => {
    if (artistCoin?.ticker) {
      dispatch(push(ASSET_DETAIL_PAGE.replace(':ticker', artistCoin.ticker)))
    }
  }

  if (isLoading || !artistCoin) {
    return null
  }
  return (
    <Paper
      column
      gap='s'
      ph='m'
      pv='s'
      onClick={handleCardClick}
      css={{ cursor: 'pointer' }}
      border='default'
    >
      <Flex gap='s' alignItems='center'>
        <TokenIcon logoURI={artistCoin.logoUri} size='xl' hex />
        <Text variant='title' size='l'>
          {artistCoin.ticker}
        </Text>
      </Flex>
      <Text variant='body' size='s'>
        {messages.cardBody}
      </Text>
      <Button size='small' onClick={handleBuyCoins} color='coinGradient'>
        {messages.buyCoins}
      </Button>
    </Paper>
  )
}
