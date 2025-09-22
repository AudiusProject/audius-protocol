import { useArtistCoin } from '@audius/common/api'
import { FixedDecimal } from '@audius/fixed-decimal'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  Flex,
  Text,
  Divider,
  IconInfo
} from '@audius/harmony'

import { TokenIcon } from '../../../components/buy-sell-modal/TokenIcon'
import { TokenInfoRow } from '../../artist-coins-launchpad-page/components/TokenInfoRow'

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
  const { data: artistCoin } = useArtistCoin(mint)

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='small'>
      <ModalHeader>
        <ModalTitle Icon={IconInfo} title={messages.details} />
      </ModalHeader>

      <ModalContent>
        <Flex direction='column' gap='l' p='l'>
          {/* Token Info Section */}
          <Flex direction='column' gap='m'>
            <Flex alignItems='center' gap='m'>
              {/* Token Icon */}
              <TokenIcon logoURI={artistCoin?.logoUri} w={64} h={64} />
              <Flex direction='column' gap='xs'>
                <Text variant='title' size='l'>
                  {artistCoin?.name ?? messages.unknownToken}
                </Text>
                <Text variant='body' size='m' color='subdued'>
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
                  ? `$${new FixedDecimal(artistCoin.price.toString(), 6).toLocaleString()}`
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
      </ModalContent>
    </Modal>
  )
}
