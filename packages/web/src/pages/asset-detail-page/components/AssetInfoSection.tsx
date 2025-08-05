import { useArtistCoin } from '@audius/common/api'
import { WidthSizes } from '@audius/common/models'
import {
  Avatar,
  Flex,
  IconGift,
  Paper,
  PlainButton,
  Text,
  useTheme
} from '@audius/harmony'
import { decodeHashId } from '@audius/sdk'
import { useDispatch } from 'react-redux'

import Skeleton from 'components/skeleton/Skeleton'
import UserBadges from 'components/user-badges/UserBadges'
import { useCoverPhoto } from 'hooks/useCoverPhoto'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'

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
  viewLeaderboard: 'View Leaderboard'
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

export const AssetInfoSection = ({ mint }: AssetDetailProps) => {
  const dispatch = useDispatch()
  const { data: coin, isLoading } = useArtistCoin({ mint })

  if (isLoading || !coin) {
    return <AssetInfoSectionSkeleton />
  }

  const title = coin.ticker ?? ''
  const CTAIcon = IconGift // Default icon for now

  const handleViewLeaderboard = () => {
    dispatch(
      setUsers({
        userListType: UserListType.COIN_LEADERBOARD,
        entityType: UserListEntityType.USER,
        entity: mint
      })
    )
    dispatch(setVisibility(true))
  }

  return (
    <Paper
      borderRadius='l'
      shadow='far'
      direction='column'
      alignItems='flex-start'
    >
      <BannerSection mint={mint} />

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
          <Text variant='body' size='m' color='subdued'>
            {messages.description1(title)}
          </Text>
          <Text variant='body' size='m' color='subdued'>
            {messages.description2(title)}
          </Text>
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
          <CTAIcon size='m' color='default' />
          <Text variant='title' size='m'>
            {messages.learnMore}
          </Text>
        </Flex>

        <PlainButton
          variant='default'
          size='default'
          onClick={handleViewLeaderboard}
        >
          {messages.viewLeaderboard}
        </PlainButton>
      </Flex>
    </Paper>
  )
}
