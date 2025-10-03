import { useArtistCoin } from '@audius/common/api'
import { coinDetailsMessages } from '@audius/common/messages'
import { formatCurrencyWithSubscript } from '@audius/common/utils'
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

const { artistCoinDetails } = coinDetailsMessages

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
      title={artistCoinDetails.details}
      Icon={IconInfo}
      size='s'
      isFullscreen
    >
      <Flex
        direction='column'
        gap='l'
        p='l'
        css={{ overflowY: 'auto', maxHeight: '100%' }}
      >
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
          <Flex direction='column' gap='xs' w='100%'>
            <Text variant='body' size='m' strength='strong' color='subdued'>
              {artistCoinDetails.coinAddress}
            </Text>
            <Text variant='body' size='m' userSelect='text'>
              {artistCoin.mint}
            </Text>
          </Flex>
        ) : null}

        {/* On-Chain Description */}
        {artistCoin?.description ? (
          <Flex direction='column' gap='xs' w='100%'>
            <Text variant='body' size='m' strength='strong' color='subdued'>
              {artistCoinDetails.onChainDescription}
            </Text>
            <Text variant='body' size='m' userSelect='text'>
              {artistCoin.description}
            </Text>
          </Flex>
        ) : null}

        <Divider />

        {/* Token Details */}
        <Flex direction='column' gap='m'>
          {artistCoin?.totalSupply ? (
            <TokenInfoRow
              label={artistCoinDetails.totalSupply}
              value={artistCoin.totalSupply.toLocaleString()}
              hasTooltip
              tooltipContent={artistCoinDetails.tooltips.totalSupply}
              variant='block'
            />
          ) : null}

          {artistCoin?.marketCap ? (
            <TokenInfoRow
              label={artistCoinDetails.marketCap}
              value={`$${artistCoin.marketCap.toLocaleString()}`}
              hasTooltip
              tooltipContent={artistCoinDetails.tooltips.marketCap}
              variant='block'
            />
          ) : null}

          {artistCoin?.price ? (
            <TokenInfoRow
              label={artistCoinDetails.price}
              value={formatCurrencyWithSubscript(artistCoin.price)}
              hasTooltip
              tooltipContent={artistCoinDetails.tooltips.price}
              variant='block'
            />
          ) : null}

          {artistCoin?.liquidity ? (
            <TokenInfoRow
              label={artistCoinDetails.liquidity}
              value={`$${artistCoin.liquidity.toLocaleString()}`}
              hasTooltip
              tooltipContent={artistCoinDetails.tooltips.liquidity}
              variant='block'
            />
          ) : null}

          {artistCoin?.circulatingSupply ? (
            <TokenInfoRow
              label={artistCoinDetails.circulatingSupply}
              value={artistCoin.circulatingSupply.toLocaleString()}
              hasTooltip
              tooltipContent={artistCoinDetails.tooltips.circulatingSupply}
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
