import { useArtistCoin } from '@audius/common/api'
import { formatCurrencyWithSubscript } from '@audius/common/utils'
import { FixedDecimal } from '@audius/fixed-decimal'
import {
  Flex,
  Text,
  Divider,
  IconInfo,
  Button,
  useTheme
} from '@audius/harmony'

import { TokenIcon } from '../../../components/buy-sell-modal/TokenIcon'
import ResponsiveModal from '../../../components/modal/ResponsiveModal'
import { TokenInfoRow } from '../../artist-coins-launchpad-page/components/TokenInfoRow'

const messages = {
  details: 'Details',
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

type ArtistCoinDetailsModalProps = {
  /**
   * Whether the modal is open
   */
  isOpen: boolean
  /**
   * Callback to close the modal
   */
  onClose: () => void
  /**
   * The mint address of the artist coin
   */
  mint: string
}

export const ArtistCoinDetailsModal = ({
  isOpen,
  onClose,
  mint
}: ArtistCoinDetailsModalProps) => {
  const { spacing } = useTheme()
  const { data: artistCoin } = useArtistCoin(mint)

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={messages.details}
      Icon={IconInfo}
      size='s'
      isFullscreen
    >
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
                {artistCoin?.name}
              </Text>
              <Text variant='body' size='m' color='subdued'>
                {artistCoin?.ticker}
              </Text>
            </Flex>
          </Flex>
        </Flex>

        <Divider />

        {/* Coin Address */}
        {artistCoin?.mint ? (
          <TokenInfoRow
            label={messages.coinAddress}
            value={artistCoin.mint}
            variant='block'
          />
        ) : null}

        {/* On-Chain Description */}
        {artistCoin?.description ? (
          <TokenInfoRow
            label={messages.onChainDescription}
            value={artistCoin.description}
            variant='block'
          />
        ) : null}

        <Divider />

        {/* Token Details */}
        <Flex direction='column' gap='m'>
          {artistCoin?.totalSupply ? (
            <TokenInfoRow
              label={messages.totalSupply}
              value={new FixedDecimal(
                artistCoin.totalSupply.toString(),
                0
              ).toLocaleString()}
              hasTooltip
              tooltipContent={tooltipContent.totalSupply}
              variant='block'
            />
          ) : null}

          {artistCoin?.marketCap ? (
            <TokenInfoRow
              label={messages.marketCap}
              value={`$${new FixedDecimal(artistCoin.marketCap.toString(), 2).toLocaleString()}`}
              hasTooltip
              tooltipContent={tooltipContent.marketCap}
              variant='block'
            />
          ) : null}

          {artistCoin?.fdv ? (
            <TokenInfoRow
              label={messages.fdv}
              value={`$${new FixedDecimal(artistCoin.fdv.toString(), 2).toLocaleString()}`}
              hasTooltip
              tooltipContent={tooltipContent.fdv}
              variant='block'
            />
          ) : null}

          {artistCoin?.price ? (
            <TokenInfoRow
              label={messages.price}
              value={formatCurrencyWithSubscript(artistCoin.price)}
              hasTooltip
              tooltipContent={tooltipContent.price}
              variant='block'
            />
          ) : null}

          {artistCoin?.liquidity ? (
            <TokenInfoRow
              label={messages.liquidity}
              value={`$${new FixedDecimal(artistCoin.liquidity.toString(), 2).toLocaleString()}`}
              hasTooltip
              tooltipContent={tooltipContent.liquidity}
              variant='block'
            />
          ) : null}

          {artistCoin?.circulatingSupply ? (
            <TokenInfoRow
              label={messages.circulatingSupply}
              value={new FixedDecimal(
                artistCoin.circulatingSupply.toString(),
                0
              ).toLocaleString()}
              hasTooltip
              tooltipContent={tooltipContent.circulatingSupply}
              variant='block'
            />
          ) : null}
        </Flex>

        {/* Close Button */}
        <Flex direction='column' gap='l' pt='l'>
          <Divider />
          <Button variant='primary' onClick={onClose} fullWidth>
            Close
          </Button>
        </Flex>
      </Flex>
    </ResponsiveModal>
  )
}
