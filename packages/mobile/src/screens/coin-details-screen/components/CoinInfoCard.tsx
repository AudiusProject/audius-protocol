import { useCallback } from 'react'

import { useArtistCoin } from '@audius/common/api'
import { WidthSizes } from '@audius/common/models'
import type { Coin } from '@audius/sdk'
import { decodeHashId } from '@audius/sdk'
import { Image, Linking } from 'react-native'

import {
  Box,
  Divider,
  Flex,
  HexagonalIcon,
  IconExternalLink,
  IconGift,
  Paper,
  PlainButton,
  Text
} from '@audius/harmony-native'
import { useCoverPhoto } from 'app/components/image/CoverPhoto'
import { useNavigation } from 'app/hooks/useNavigation'
import { env } from 'app/services/env'

// TODO: Move these to common messages
const messages = {
  loading: 'Loading...',
  createdBy: 'Created By',
  whatIs: (title: string) => `What is ${title}?`,
  description1: (title: string) =>
    `${title} is a community token on the Audius platform. You can use ${title} for tipping artists, participating in community activities, and engaging with the decentralized music ecosystem.`,
  description2: (title: string) =>
    `Holding ${title} gives you access to exclusive features and helps support your favorite artists on Audius.`,
  learnMore: 'Learn More',
  viewLeaderboard: 'View Leaderboard',
  title: 'Bronze +',
  profileFlair: 'Profile Flair',
  customDiscordRole: 'Custom Discord Role',
  messageBlasts: 'Message Blasts',
  openDiscord: 'Open The Discord',
  refreshDiscordRole: 'Refresh Discord Role',
  browseRewards: 'Browse Rewards',
  rewardTiers: 'Reward Tiers'
}

const BannerSection = ({ mint }: { mint: string }) => {
  const { data: coin, isLoading } = useArtistCoin({ mint })

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

  const title = coin.ticker ?? ''
  const descriptionParagraphs = coin.description.split('\n') ?? []

  return (
    <Flex
      direction='column'
      alignItems='flex-start'
      alignSelf='stretch'
      p='xl'
      gap='l'
    >
      <Flex alignSelf='stretch'>
        <Text variant='heading' size='s' color='heading'>
          {messages.whatIs(title)}
        </Text>
      </Flex>

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
  const { data: coin, isLoading } = useArtistCoin({ mint })
  const navigation = useNavigation()

  const handleLearnMore = useCallback(() => {
    // Open the coin website in browser
    if (coin?.website) {
      Linking.openURL(coin?.website)
    }
  }, [coin?.website])

  const handleBrowseRewards = useCallback(() => {
    navigation.navigate('RewardsScreen')
  }, [navigation])

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
    </Paper>
  )
}
