import { useArtistCoinByTicker } from '@audius/common/api'
import {
  formatCurrencyWithSubscript,
  formatTickerFromUrl
} from '@audius/common/utils'
import { FixedDecimal } from '@audius/fixed-decimal'
import { Divider, Flex, Text, useTheme } from '@audius/harmony'
import { useLocation } from 'react-router-dom-v5-compat'

import { TokenIcon } from 'components/buy-sell-modal/TokenIcon'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import { TokenInfoRow } from 'pages/artist-coins-launchpad-page/components'

const messages = {
  details: 'Details',
  unknown: 'Unknown',
  unknownToken: 'Unknown Token',
  unknownTicker: 'UNKNOWN',
  coinAddress: 'Coin Address',
  onChainDescription: 'On-Chain Description',
  totalSupply: 'Total Supply',
  marketCap: 'Market Cap',
  fdv: 'Fully Diluted Valuation',
  price: 'Current Price',
  liquidity: 'Liquidity',
  circulatingSupply: 'Circulating Supply'
}

const tooltipContent = {
  totalSupply:
    'The total number of your artist coins that will ever exist. This amount is fixed and never changes.',
  marketCap:
    'The current total value of all your artist coins in circulation, calculated by multiplying the current price by the total supply.',
  fdv: 'The theoretical market cap if all tokens were in circulation, calculated by multiplying the current price by the total supply.',
  price: 'The current price of a single artist coin in USD.',
  liquidity:
    'The amount of funds available for trading your artist coin, which affects how easily it can be bought or sold.',
  circulatingSupply:
    'The number of artist coins currently available for trading, excluding any tokens that are locked or reserved.'
}

export const ArtistCoinDetailsPage = () => {
  const location = useLocation()
  // Locations should be in the format /coins/:ticker/details (COIN_DETAIL_ROUTE)
  const ticker = location.pathname.split('/')[2]
  const { data: artistCoin } = useArtistCoinByTicker({
    ticker: formatTickerFromUrl(ticker)
  })
  const { spacing } = useTheme()

  return (
    <MobilePageContainer fullHeight>
      <Flex column w='100%' backgroundColor='white'>
        <Flex direction='column' gap='l' p='l'>
          {/* Token Info Section */}
          <Flex direction='column' gap='m'>
            <Flex alignItems='center' gap='m'>
              {/* Token Icon */}
              <TokenIcon
                logoURI={artistCoin?.logoUri}
                w={spacing['4xl']}
                h={spacing['4xl']}
                hex
              />
              <Flex direction='column' gap='xs'>
                <Text variant='title' size='l'>
                  {artistCoin?.name ?? messages.unknownToken}
                </Text>
                <Text
                  variant={artistCoin?.name ? 'body' : 'title'}
                  size={artistCoin?.name ? 'm' : 'l'}
                  color={artistCoin?.name ? 'subdued' : 'default'}
                >
                  {artistCoin?.ticker ?? messages.unknownTicker}
                </Text>
              </Flex>
            </Flex>
          </Flex>

          <Divider />

          {/* Coin Address */}
          <Flex direction='column' gap='xs'>
            <Text variant='label' size='s' color='subdued'>
              {messages.coinAddress}
            </Text>
            <Text variant='body' size='s' color='default'>
              {artistCoin?.mint ?? messages.unknown}
            </Text>
          </Flex>

          {/* On-Chain Description */}
          <Flex direction='column' gap='xs'>
            <Text variant='label' size='s' color='subdued'>
              {messages.onChainDescription}
            </Text>
            <Text variant='body' size='s' color='default'>
              {artistCoin?.description ??
                `${artistCoin?.ticker ?? 'UNKNOWN'} is an artist coin created on Audius. Learn more at https://audius.co/coin/${artistCoin?.ticker ?? 'unknown'}`}
            </Text>
          </Flex>

          <Divider />

          {/* Token Details */}
          <Flex direction='column' gap='m'>
            <TokenInfoRow
              label={messages.totalSupply}
              value={
                artistCoin?.totalSupply
                  ? new FixedDecimal(
                      artistCoin.totalSupply.toString(),
                      0
                    ).toLocaleString()
                  : messages.unknown
              }
              hasTooltip
              tooltipContent={tooltipContent.totalSupply}
              variant='block'
            />

            <TokenInfoRow
              label={messages.marketCap}
              value={
                artistCoin?.marketCap
                  ? `$${new FixedDecimal(artistCoin.marketCap.toString(), 2).toLocaleString()}`
                  : messages.unknown
              }
              hasTooltip
              tooltipContent={tooltipContent.marketCap}
              variant='block'
            />

            <TokenInfoRow
              label={messages.fdv}
              value={
                artistCoin?.fdv
                  ? `$${new FixedDecimal(artistCoin.fdv.toString(), 2).toLocaleString()}`
                  : messages.unknown
              }
              hasTooltip
              tooltipContent={tooltipContent.fdv}
              variant='block'
            />

            <TokenInfoRow
              label={messages.price}
              value={
                artistCoin?.price
                  ? formatCurrencyWithSubscript(artistCoin.price)
                  : messages.unknown
              }
              hasTooltip
              tooltipContent={tooltipContent.price}
              variant='block'
            />

            <TokenInfoRow
              label={messages.liquidity}
              value={
                artistCoin?.liquidity
                  ? `$${new FixedDecimal(artistCoin.liquidity.toString(), 2).toLocaleString()}`
                  : messages.unknown
              }
              hasTooltip
              tooltipContent={tooltipContent.liquidity}
              variant='block'
            />

            <TokenInfoRow
              label={messages.circulatingSupply}
              value={
                artistCoin?.circulatingSupply
                  ? new FixedDecimal(
                      artistCoin.circulatingSupply.toString(),
                      0
                    ).toLocaleString()
                  : messages.unknown
              }
              hasTooltip
              tooltipContent={tooltipContent.circulatingSupply}
              variant='block'
            />
          </Flex>
        </Flex>
      </Flex>
    </MobilePageContainer>
  )
}
