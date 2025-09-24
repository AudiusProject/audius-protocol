import { useCallback } from 'react'

import { useArtistCoin } from '@audius/common/api'
import { useArtistCoinDetailsModal } from '@audius/common/store'
import { formatCurrencyWithSubscript } from '@audius/common/utils'
import { FixedDecimal } from '@audius/fixed-decimal'
import Clipboard from '@react-native-clipboard/clipboard'

import { Flex, Text, Divider, Button, useTheme } from '@audius/harmony-native'
import { TokenIcon } from 'app/components/core'
import Drawer from 'app/components/drawer/Drawer'
import { useToast } from 'app/hooks/useToast'

import { DrawerHeader } from '../drawer/DrawerHeader'

const messages = {
  title: 'Artist Coin Details',
  coinAddress: 'Coin Address',
  onChainDescription: 'On-Chain Description',
  totalSupply: 'Total Supply',
  marketCap: 'Market Cap',
  fdv: 'Fully Diluted Valuation',
  price: 'Current Price',
  liquidity: 'Liquidity',
  circulatingSupply: 'Circulating Supply',
  close: 'Close',
  copied: 'Copied to clipboard!'
}

export const ArtistCoinDetailsDrawer = () => {
  const { spacing } = useTheme()
  const { toast } = useToast()
  const { isOpen, onClose, data: modalData } = useArtistCoinDetailsModal()
  const mint = modalData?.mint
  const { data: artistCoin } = useArtistCoin(mint)

  const handleCopyAddress = useCallback(() => {
    if (artistCoin?.mint) {
      Clipboard.setString(artistCoin.mint)
      toast({ content: messages.copied, type: 'info' })
    }
  }, [artistCoin?.mint, toast])

  if (!artistCoin?.mint) {
    return null
  }

  const renderHeader = () => {
    return (
      <Flex pv='l' ph='xl' gap='m' mb='m'>
        <DrawerHeader onClose={onClose} title={messages.title} />
        <Divider />
      </Flex>
    )
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} drawerHeader={renderHeader}>
      <Flex direction='column' gap='xl' ph='xl'>
        {/* Token Info Section */}
        <Flex direction='column' gap='m'>
          <Flex row alignItems='center' gap='m'>
            {/* Token Icon */}
            <TokenIcon logoURI={artistCoin?.logoUri} size={spacing['4xl']} />
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
          <Flex direction='column' gap='xs'>
            <Text variant='label' size='s' color='subdued'>
              {messages.coinAddress}
            </Text>
            <Text
              variant='body'
              size='s'
              numberOfLines={1}
              ellipsizeMode='middle'
              onPress={handleCopyAddress}
            >
              {artistCoin.mint}
            </Text>
          </Flex>
        ) : null}

        {/* On-Chain Description */}
        {artistCoin?.description ? (
          <Flex direction='column' gap='xs'>
            <Text variant='label' size='s' color='subdued'>
              {messages.onChainDescription}
            </Text>
            <Text variant='body' size='s'>
              {artistCoin.description}
            </Text>
          </Flex>
        ) : null}

        {/* Token Details */}
        <Flex direction='column' gap='m'>
          {artistCoin?.totalSupply ? (
            <Flex direction='column' gap='xs'>
              <Text variant='label' size='s' color='subdued'>
                {messages.totalSupply}
              </Text>
              <Text variant='body' size='s'>
                {new FixedDecimal(
                  artistCoin.totalSupply.toString(),
                  0
                ).toLocaleString()}
              </Text>
            </Flex>
          ) : null}

          {artistCoin?.marketCap ? (
            <Flex direction='column' gap='xs'>
              <Text variant='label' size='s' color='subdued'>
                {messages.marketCap}
              </Text>
              <Text variant='body' size='s'>
                $
                {new FixedDecimal(
                  artistCoin.marketCap.toString(),
                  2
                ).toLocaleString()}
              </Text>
            </Flex>
          ) : null}

          {artistCoin?.fdv ? (
            <Flex direction='column' gap='xs'>
              <Text variant='label' size='s' color='subdued'>
                {messages.fdv}
              </Text>
              <Text variant='body' size='s'>
                $
                {new FixedDecimal(
                  artistCoin.fdv.toString(),
                  2
                ).toLocaleString()}
              </Text>
            </Flex>
          ) : null}

          {artistCoin?.price ? (
            <Flex direction='column' gap='xs'>
              <Text variant='label' size='s' color='subdued'>
                {messages.price}
              </Text>
              <Text variant='body' size='s'>
                {formatCurrencyWithSubscript(artistCoin.price)}
              </Text>
            </Flex>
          ) : null}

          {artistCoin?.liquidity ? (
            <Flex direction='column' gap='xs'>
              <Text variant='label' size='s' color='subdued'>
                {messages.liquidity}
              </Text>
              <Text variant='body' size='s'>
                $
                {new FixedDecimal(
                  artistCoin.liquidity.toString(),
                  2
                ).toLocaleString()}
              </Text>
            </Flex>
          ) : null}

          {artistCoin?.circulatingSupply ? (
            <Flex direction='column' gap='xs'>
              <Text variant='label' size='s' color='subdued'>
                {messages.circulatingSupply}
              </Text>
              <Text variant='body' size='s'>
                {new FixedDecimal(
                  artistCoin.circulatingSupply.toString(),
                  0
                ).toLocaleString()}
              </Text>
            </Flex>
          ) : null}
        </Flex>

        {/* Close Button */}
        <Button variant='primary' fullWidth onPress={onClose}>
          {messages.close}
        </Button>
      </Flex>
    </Drawer>
  )
}
