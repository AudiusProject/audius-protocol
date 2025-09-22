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
        <ModalTitle Icon={IconInfo} title='Details' />
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
                  {artistCoin?.name ?? 'Unknown Token'}
                </Text>
                <Text variant='body' size='m' color='subdued'>
                  {artistCoin?.ticker ?? 'UNKNOWN'}
                </Text>
              </Flex>
            </Flex>
          </Flex>

          <Divider />

          {/* Coin Address */}
          <Flex direction='column' gap='xs'>
            <Text variant='label' size='s' color='subdued'>
              Coin Address
            </Text>
            <Text variant='body' size='s' color='default'>
              {artistCoin?.mint ?? 'N/A'}
            </Text>
          </Flex>

          {/* On-Chain Description */}
          <Flex direction='column' gap='xs'>
            <Text variant='label' size='s' color='subdued'>
              On-Chain Description
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
              label='Total Supply'
              value={
                artistCoin?.totalSupply
                  ? new FixedDecimal(artistCoin.totalSupply, 0).toLocaleString()
                  : 'N/A'
              }
              hasTooltip
              tooltipContent={tooltipContent.totalSupply}
              variant='block'
            />

            <TokenInfoRow
              label='Market Cap'
              value={
                artistCoin?.marketCap
                  ? `$${new FixedDecimal(artistCoin.marketCap, 2).toLocaleString()}`
                  : 'N/A'
              }
              hasTooltip
              tooltipContent={tooltipContent.marketCap}
              variant='block'
            />

            <TokenInfoRow
              label='Fully Diluted Valuation'
              value={
                artistCoin?.fdv
                  ? `$${new FixedDecimal(artistCoin.fdv, 2).toLocaleString()}`
                  : 'N/A'
              }
              hasTooltip
              tooltipContent={tooltipContent.fdv}
              variant='block'
            />

            <TokenInfoRow
              label='Current Price'
              value={
                artistCoin?.price
                  ? `$${new FixedDecimal(artistCoin.price, 6).toLocaleString()}`
                  : 'N/A'
              }
              hasTooltip
              tooltipContent={tooltipContent.price}
              variant='block'
            />

            <TokenInfoRow
              label='Liquidity'
              value={
                artistCoin?.liquidity
                  ? `$${new FixedDecimal(artistCoin.liquidity, 2).toLocaleString()}`
                  : 'N/A'
              }
              hasTooltip
              tooltipContent={tooltipContent.liquidity}
              variant='block'
            />

            <TokenInfoRow
              label='Circulating Supply'
              value={
                artistCoin?.circulatingSupply
                  ? new FixedDecimal(
                      artistCoin.circulatingSupply,
                      0
                    ).toLocaleString()
                  : 'N/A'
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
