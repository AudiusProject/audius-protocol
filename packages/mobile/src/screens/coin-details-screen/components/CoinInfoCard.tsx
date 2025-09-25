import { useCallback } from 'react'

import { useArtistCoin } from '@audius/common/api'
import { coinDetailsMessages } from '@audius/common/messages'
import { WidthSizes } from '@audius/common/models'
import { shortenSPLAddress } from '@audius/common/utils'
import type { Coin } from '@audius/sdk'
import { decodeHashId } from '@audius/sdk'
import Clipboard from '@react-native-clipboard/clipboard'
import { Image, Linking } from 'react-native'

import {
  Box,
  Divider,
  Flex,
  HexagonalIcon,
  IconCopy,
  IconExternalLink,
  IconGift,
  Paper,
  PlainButton,
  Text
} from '@audius/harmony-native'
import { useCoverPhoto } from 'app/components/image/CoverPhoto'
import { useNavigation } from 'app/hooks/useNavigation'
import { useToast } from 'app/hooks/useToast'
import { env } from 'app/services/env'

const messages = coinDetailsMessages.coinInfo
const overflowMessages = coinDetailsMessages.overflowMenu

const BannerSection = ({ mint }: { mint: string }) => {
  const { data: coin, isLoading } = useArtistCoin(mint)

  const userId = coin?.ownerId
    ? (decodeHashId(coin.ownerId) ?? undefined)
    : undefined

  const { source } = useCoverPhoto({
    userId,
    size: WidthSizes.SIZE_640
  })

  if (isLoading || !coin) {
    // TODO: Add loading state
    return null
  }

  const logoURI = coin.logoUri
  const name = coin.ticker

  const bannerHeight = 120
  const iconSize = 24

  return (
    <Flex h={bannerHeight}>
      {/* Background Image */}
      {source && (
        <Image
          source={source}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
          resizeMode='cover'
        />
      )}

      {/* Background Overlay */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.25)'
        }}
      />

      {/* Content */}
      <Flex
        direction='column'
        alignItems='flex-start'
        alignSelf='stretch'
        p='l'
        ph='xl'
        gap='s'
      >
        <Text variant='label' size='m' color='staticWhite' shadow='emphasis'>
          {messages.createdBy}
        </Text>

        <Flex
          row
          alignItems='center'
          gap='xs'
          p='xs'
          backgroundColor='white'
          borderRadius='circle'
          border='default'
        >
          <HexagonalIcon size={iconSize}>
            <Image
              source={{ uri: logoURI }}
              style={{
                width: iconSize,
                height: iconSize
              }}
            />
          </HexagonalIcon>
          <Flex alignItems='center' gap='xs'>
            <Text variant='body' size='l'>
              {name}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

const CoinDescriptionSection = ({ coin }: { coin: Coin }) => {
  if (!coin.description) return null

  const descriptionParagraphs = coin.description.split('\n') ?? []

  return (
    <Flex
      direction='column'
      alignItems='flex-start'
      alignSelf='stretch'
      p='xl'
      gap='l'
    >
      <Flex direction='column' gap='m'>
        {descriptionParagraphs.map((paragraph) => {
          if (paragraph.trim() === '') {
            return null
          }

          return (
            <Text key={paragraph.slice(0, 10)} variant='body' size='m'>
              {paragraph}
            </Text>
          )
        })}
      </Flex>
    </Flex>
  )
}

export const CoinInfoCard = ({ mint }: { mint: string }) => {
  const { data: coin, isLoading } = useArtistCoin(mint)
  const navigation = useNavigation()
  const { toast } = useToast()

  const handleLearnMore = useCallback(() => {
    // Open the coin website in browser
    if (coin?.website) {
      Linking.openURL(coin?.website)
    }
  }, [coin?.website])

  const handleBrowseRewards = useCallback(() => {
    navigation.navigate('RewardsScreen')
  }, [navigation])

  const handleCopyAddress = useCallback(() => {
    Clipboard.setString(mint)
    toast({ content: overflowMessages.copiedToClipboard, type: 'info' })
  }, [mint, toast])

  if (isLoading || !coin) {
    return null
  }

  const isWAudio = coin.mint === env.WAUDIO_MINT_ADDRESS
  const CTAIcon = isWAudio ? IconGift : IconExternalLink

  return (
    <Paper
      borderRadius='l'
      shadow='far'
      border='default'
      column
      alignItems='flex-start'
      style={{ overflow: 'hidden' }}
    >
      <BannerSection mint={mint} />
      <CoinDescriptionSection coin={coin} />
      <Divider style={{ width: '100%' }} />
      <Flex direction='column' w='100%' ph='xl' pv='l'>
        <PlainButton
          style={{ alignSelf: 'flex-start' }}
          onPress={isWAudio ? handleBrowseRewards : handleLearnMore}
          iconLeft={CTAIcon}
        >
          {isWAudio ? messages.browseRewards : messages.learnMore}
        </PlainButton>
      </Flex>
      <Divider style={{ width: '100%' }} />
      <Flex
        direction='row'
        w='100%'
        ph='xl'
        pv='l'
        justifyContent='space-between'
        alignItems='center'
      >
        <PlainButton onPress={handleCopyAddress} iconLeft={IconCopy}>
          {overflowMessages.copyCoinAddress}
        </PlainButton>
        <Text variant='body' size='m' color='subdued'>
          {shortenSPLAddress(mint)}
        </Text>
      </Flex>
    </Paper>
  )
}
