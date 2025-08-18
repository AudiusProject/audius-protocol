import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'

import {
  UserCoin,
  useArtistCoin,
  useCurrentUserId,
  useUserCoins
} from '@audius/common/api'
import { WidthSizes } from '@audius/common/models'
import {
  getTierForUser,
  getTierForUserNonWei
} from '@audius/common/src/store/wallet/utils'
import { AUDIUS_DISCORD_OAUTH_LINK } from '@audius/common/src/utils/route'
import {
  Flex,
  Paper,
  Text,
  useTheme,
  PlainButton,
  IconDiscord,
  IconGift,
  Avatar,
  IconExternalLink,
  ModalContent,
  ModalHeader,
  ModalTitle,
  Modal
} from '@audius/harmony'
import { decodeHashId } from '@audius/sdk'

import Skeleton from 'components/skeleton/Skeleton'
import Tooltip from 'components/tooltip/Tooltip'
import UserBadges from 'components/user-badges/UserBadges'
import { useCoverPhoto } from 'hooks/useCoverPhoto'
import Tiers, { TierLevel } from 'pages/rewards-page/Tiers'
import { env } from 'services/env'

import { AssetDetailProps } from '../types'

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
  openDiscord: 'Join The Discord',
  refreshDiscordRole: 'Refresh Discord Role',
  browseRewards: 'Browse Rewards',
  rewardTiers: 'Reward Tiers',
  discordTooltip: 'You must have coins to unlock the discord'
}

const BANNER_HEIGHT = 120

const AssetInfoSectionSkeleton = () => {
  return (
    <Paper
      borderRadius='l'
      shadow='far'
      direction='column'
      alignItems='flex-start'
    >
      {/* Banner skeleton */}
      <Flex
        direction='column'
        alignItems='flex-start'
        alignSelf='stretch'
        h={BANNER_HEIGHT}
        css={{ backgroundColor: '#f0f0f0' }}
      >
        <Flex
          direction='column'
          alignItems='flex-start'
          alignSelf='stretch'
          p='l'
          gap='s'
        >
          <Skeleton width='80px' height='16px' />
          <Flex
            alignItems='center'
            gap='xs'
            p='xs'
            backgroundColor='white'
            borderRadius='circle'
            border='default'
          >
            <Skeleton width='32px' height='32px' />
            <Skeleton width='100px' height='20px' />
          </Flex>
        </Flex>
      </Flex>

      {/* Content skeleton */}
      <Flex
        direction='column'
        alignItems='flex-start'
        alignSelf='stretch'
        p='xl'
        gap='l'
      >
        <Skeleton width='200px' height='24px' />
        <Flex direction='column' gap='m'>
          <Skeleton width='100%' height='20px' />
          <Skeleton width='90%' height='20px' />
          <Skeleton width='100%' height='20px' />
          <Skeleton width='80%' height='20px' />
        </Flex>
      </Flex>

      {/* Footer skeleton */}
      <Flex
        alignItems='center'
        justifyContent='space-between'
        alignSelf='stretch'
        p='xl'
        borderTop='default'
      >
        <Flex alignItems='center' gap='s'>
          <Skeleton width='24px' height='24px' />
          <Skeleton width='100px' height='20px' />
        </Flex>
        <Skeleton width='120px' height='20px' />
      </Flex>
    </Paper>
  )
}

const TokenIcon = ({ logoURI }: { logoURI?: string }) => {
  const { spacing } = useTheme()

  if (!logoURI) return null

  return <Avatar src={logoURI} w={spacing.unit8} h={spacing.unit8} />
}

const BannerSection = ({ mint }: AssetDetailProps) => {
  const { data: coin, isLoading } = useArtistCoin({ mint })

  const userId = coin?.ownerId
    ? (decodeHashId(coin.ownerId) ?? undefined)
    : undefined

  const { image: coverPhoto } = useCoverPhoto({
    userId,
    size: WidthSizes.SIZE_640
  })

  if (isLoading || !coin) {
    return (
      <Flex
        direction='column'
        alignItems='flex-start'
        alignSelf='stretch'
        h={BANNER_HEIGHT}
        css={{ backgroundColor: '#f0f0f0' }}
      >
        <Flex
          direction='column'
          alignItems='flex-start'
          alignSelf='stretch'
          p='l'
          gap='s'
        >
          <Skeleton width='80px' height='16px' />
          <Flex
            alignItems='center'
            gap='xs'
            p='xs'
            backgroundColor='white'
            borderRadius='circle'
            border='default'
          >
            <Skeleton width='32px' height='32px' />
            <Skeleton width='100px' height='20px' />
          </Flex>
        </Flex>
      </Flex>
    )
  }

  const logoURI = coin.logoUri
  const name = coin.ticker

  return (
    <Flex
      direction='column'
      alignItems='flex-start'
      alignSelf='stretch'
      h={BANNER_HEIGHT}
      css={{
        background: `linear-gradient(90deg, rgba(0, 0, 0, 0.05) 10%, rgba(0, 0, 0, 0.02) 20%, rgba(0, 0, 0, 0.01) 30%, rgba(0, 0, 0, 0) 45%), url("${coverPhoto}")`,
        backgroundSize: 'auto, cover',
        backgroundPosition: '0% 0%, 50% 50%',
        backgroundRepeat: 'repeat, no-repeat',
        position: 'relative'
      }}
    >
      <Flex
        direction='column'
        alignItems='flex-start'
        alignSelf='stretch'
        p='l'
        gap='s'
      >
        <Text variant='label' size='m' color='staticWhite' shadow='emphasis'>
          {messages.createdBy}
        </Text>

        <Flex
          alignItems='center'
          gap='xs'
          p='xs'
          backgroundColor='white'
          borderRadius='circle'
          border='default'
        >
          <TokenIcon logoURI={logoURI} />
          <Flex alignItems='center' gap='xs'>
            <Text variant='body' size='l'>
              {name}
            </Text>
            {userId && <UserBadges userId={userId} size='s' inline />}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

// TODO: make this structure more legit this if we add more coins with tiered rewards
const COIN_TIER_MAP = {
  $AUDIO: getTierForUserNonWei
}

const makeDiscordOauthStateString = (userCoins: UserCoin[]) => {
  const coinTiers = userCoins.reduce(
    (acc, coin) => {
      const cleanTicker = coin.ticker.replace('$', '')
      if (COIN_TIER_MAP[coin.ticker]) {
        const tier = COIN_TIER_MAP[coin.ticker](coin.balance)
        acc[cleanTicker] = tier
      } else {
        acc[cleanTicker] = 'holder'
      }
      return acc
    },
    {} as Record<string, string>
  )

  return JSON.stringify(coinTiers)
}

export const AssetInfoSection = ({ mint }: AssetDetailProps) => {
  const [isTiersModalOpen, setIsTiersModalOpen] = useState(false)

  const { data: coin, isLoading } = useArtistCoin({ mint })
  const { data: currentUserId } = useCurrentUserId()
  const { data: userCoins } = useUserCoins({ userId: currentUserId })
  const userToken = useMemo(
    () => userCoins?.find((coin) => coin.mint === mint),
    [userCoins, mint]
  )
  const { balance: userTokenBalance } = userToken ?? {}

  const descriptionParagraphs = coin?.description?.split('\n') ?? []

  const openDiscord = () => {
    const tierStateString = makeDiscordOauthStateString(userCoins ?? [])
    window.open(
      `${AUDIUS_DISCORD_OAUTH_LINK}&state=${tierStateString}`,
      '_blank'
    )
  }

  const handleLearnMore = () => {
    window.open(coin?.website, '_blank')
  }

  const handleBrowseRewards = useCallback(() => {
    setIsTiersModalOpen(true)
  }, [])

  const handleCloseTiersModal = useCallback(() => {
    setIsTiersModalOpen(false)
  }, [])

  if (isLoading || !coin) {
    return <AssetInfoSectionSkeleton />
  }

  const title = coin.ticker ?? ''
  const isWAudio = coin.mint === env.WAUDIO_MINT_ADDRESS
  const CTAIcon = isWAudio ? IconGift : IconExternalLink

  const userHasNoBalance = !userTokenBalance || Number(userTokenBalance) <= 0
  const TooltipWrapper = userHasNoBalance ? Tooltip : Fragment

  return (
    <>
      <Modal
        isOpen={isTiersModalOpen}
        onClose={handleCloseTiersModal}
        size='large'
        css={{ maxWidth: '90vw' }}
      >
        <ModalHeader>
          <ModalTitle title={messages.rewardTiers} />
        </ModalHeader>
        <ModalContent css={{ padding: 0, overflow: 'auto' }}>
          <Tiers />
        </ModalContent>
      </Modal>
      <Paper
        borderRadius='l'
        shadow='far'
        direction='column'
        alignItems='flex-start'
      >
        <BannerSection mint={mint} />

        {coin.description ? (
          <Flex
            direction='column'
            alignItems='flex-start'
            alignSelf='stretch'
            p='xl'
            gap='l'
          >
            <Flex alignItems='center' alignSelf='stretch'>
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
                  <Text
                    key={paragraph.slice(0, 10)}
                    variant='body'
                    size='m'
                    color='subdued'
                  >
                    {paragraph}
                  </Text>
                )
              })}
            </Flex>
          </Flex>
        ) : null}

        <Flex
          alignItems='center'
          justifyContent='space-between'
          alignSelf='stretch'
          p='xl'
          borderTop='default'
        >
          <Flex alignItems='center' justifyContent='center' gap='s'>
            <PlainButton
              onClick={isWAudio ? handleBrowseRewards : handleLearnMore}
              iconLeft={CTAIcon}
              variant='default'
              size='default'
            >
              {isWAudio ? messages.browseRewards : messages.learnMore}
            </PlainButton>
          </Flex>
        </Flex>
        <Flex
          alignItems='center'
          justifyContent='space-between'
          alignSelf='stretch'
          p='xl'
          borderTop='default'
        >
          <Flex alignItems='center' justifyContent='center' gap='s'>
            <TooltipWrapper text={messages.discordTooltip}>
              {/* The tooltip needs a wrapper to work */}
              <Flex style={{ cursor: 'pointer' }}>
                <PlainButton
                  onClick={openDiscord}
                  iconLeft={IconDiscord}
                  variant='default'
                  size='default'
                  disabled={userHasNoBalance}
                >
                  {messages.openDiscord}
                </PlainButton>
              </Flex>
            </TooltipWrapper>
          </Flex>
        </Flex>
      </Paper>
    </>
  )
}
