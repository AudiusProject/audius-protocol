import { useCallback, useMemo, useState } from 'react'

import {
  useArtistCoin,
  useCurrentUserId,
  useUser,
  useUserCoins
} from '@audius/common/api'
import { useDiscordOAuthLink } from '@audius/common/hooks'
import { coinDetailsMessages } from '@audius/common/messages'
import { WidthSizes } from '@audius/common/models'
import {
  Flex,
  Paper,
  Text,
  PlainButton,
  IconDiscord,
  IconGift,
  IconExternalLink,
  ModalContent,
  ModalHeader,
  ModalTitle,
  Modal
} from '@audius/harmony'
import { decodeHashId } from '@audius/sdk'

import Skeleton from 'components/skeleton/Skeleton'
import Tooltip from 'components/tooltip/Tooltip'
import { UserTokenBadge } from 'components/user-token-badge/UserTokenBadge'
import { useCoverPhoto } from 'hooks/useCoverPhoto'
import Tiers from 'pages/rewards-page/Tiers'
import { env } from 'services/env'

const messages = coinDetailsMessages.coinInfo

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

type BannerSectionProps = {
  mint: string
}

const BannerSection = ({ mint }: BannerSectionProps) => {
  const { data: coin, isLoading } = useArtistCoin({ mint })

  const userId = coin?.ownerId
    ? (decodeHashId(coin.ownerId) ?? undefined)
    : undefined

  const { data: owner } = useUser(userId)
  const { image: coverPhoto } = useCoverPhoto({
    userId,
    size: WidthSizes.SIZE_640
  })

  if (isLoading || !coin || !owner) {
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

        {userId && <UserTokenBadge userId={userId} />}
      </Flex>
    </Flex>
  )
}

type AssetInfoSectionProps = {
  mint: string
}

export const AssetInfoSection = ({ mint }: AssetInfoSectionProps) => {
  const [isTiersModalOpen, setIsTiersModalOpen] = useState(false)

  const { data: coin, isLoading } = useArtistCoin({ mint })
  const { data: currentUserId } = useCurrentUserId()
  const { data: userCoins } = useUserCoins({ userId: currentUserId })
  const userToken = useMemo(
    () => userCoins?.find((coin) => coin.mint === mint),
    [userCoins, mint]
  )
  const discordOAuthLink = useDiscordOAuthLink(userToken?.ticker)
  const { balance: userTokenBalance } = userToken ?? {}

  const descriptionParagraphs = coin?.description?.split('\n') ?? []

  const openDiscord = () => {
    window.open(discordOAuthLink, '_blank')
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

  const isUserBalanceUnavailable =
    !userTokenBalance || Number(userTokenBalance) <= 0

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
          p='l'
          borderTop='default'
        >
          <Flex alignItems='center' justifyContent='center' gap='s'>
            <PlainButton
              onClick={isWAudio ? handleBrowseRewards : handleLearnMore}
              iconLeft={CTAIcon}
              variant='default'
              size='large'
            >
              {isWAudio ? messages.browseRewards : messages.learnMore}
            </PlainButton>
          </Flex>
        </Flex>
        <Flex
          alignItems='center'
          justifyContent='space-between'
          alignSelf='stretch'
          p='l'
          borderTop='default'
        >
          <Flex alignItems='center' justifyContent='center' gap='s'>
            {isUserBalanceUnavailable ? (
              <Tooltip text={messages.discordDisabledTooltip(coin?.ticker)}>
                <Flex style={{ cursor: 'pointer' }}>
                  <PlainButton
                    onClick={openDiscord}
                    iconLeft={IconDiscord}
                    variant='default'
                    size='large'
                    disabled={isUserBalanceUnavailable}
                  >
                    {messages.openDiscord}
                  </PlainButton>
                </Flex>
              </Tooltip>
            ) : (
              <Flex style={{ cursor: 'pointer' }}>
                <PlainButton
                  onClick={openDiscord}
                  iconLeft={IconDiscord}
                  variant='default'
                  size='large'
                  disabled={isUserBalanceUnavailable}
                >
                  {messages.openDiscord}
                </PlainButton>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Paper>
    </>
  )
}
