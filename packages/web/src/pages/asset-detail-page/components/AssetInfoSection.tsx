import { useCallback, useContext, useMemo } from 'react'

import type { Coin } from '@audius/common/adapters'
import {
  useArtistCoin,
  useUser,
  useUserCoins,
  useConnectedWallets,
  useCurrentAccountUser
} from '@audius/common/api'
import { useDiscordOAuthLink } from '@audius/common/hooks'
import { coinDetailsMessages } from '@audius/common/messages'
import { Feature, WidthSizes } from '@audius/common/models'
import {
  getTokenDecimalPlaces,
  removeNullable,
  route,
  shortenSPLAddress
} from '@audius/common/utils'
import { wAUDIO } from '@audius/fixed-decimal'
import {
  Flex,
  IconCopy,
  IconDiscord,
  IconExternalLink,
  IconGift,
  IconInstagram,
  IconLink,
  IconTikTok,
  IconX,
  IconInfo,
  LoadingSpinner,
  Paper,
  PlainButton,
  Text,
  TextLink,
  useTheme
} from '@audius/harmony'
import { HashId } from '@audius/sdk'
import { useDispatch } from 'react-redux'

import { ExternalLink } from 'components/link/ExternalLink'
import Skeleton from 'components/skeleton/Skeleton'
import { ToastContext } from 'components/toast/ToastContext'
import Tooltip from 'components/tooltip/Tooltip'
import { UserGeneratedText } from 'components/user-generated-text'
import { UserTokenBadge } from 'components/user-token-badge/UserTokenBadge'
import { useClaimFees } from 'hooks/useClaimFees'
import { useCoverPhoto } from 'hooks/useCoverPhoto'
import { getLastConnectedSolWallet } from 'pages/artist-coins-launchpad-page/utils'
import { env } from 'services/env'
import { reportToSentry } from 'store/errors/reportToSentry'
import { copyToClipboard } from 'utils/clipboardUtil'
import { push } from 'utils/navigation'

const messages = coinDetailsMessages.coinInfo
const overflowMessages = coinDetailsMessages.overflowMenu
const toastMessages = coinDetailsMessages.toasts

const BANNER_HEIGHT = 120

// Helper function to detect platform from URL
const detectPlatform = (
  url: string
): 'x' | 'instagram' | 'tiktok' | 'website' => {
  const cleanUrl = url.toLowerCase().trim()

  if (cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com')) {
    return 'x'
  }
  if (cleanUrl.includes('instagram.com')) {
    return 'instagram'
  }
  if (cleanUrl.includes('tiktok.com')) {
    return 'tiktok'
  }

  return 'website'
}

// Get platform icon
const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'x':
      return IconX
    case 'instagram':
      return IconInstagram
    case 'tiktok':
      return IconTikTok
    case 'website':
    default:
      return IconLink
  }
}

const SocialLinksDisplay = ({ coin }: { coin: Coin }) => {
  const socialLinks = [coin.link1, coin.link2, coin.link3, coin.link4].filter(
    removeNullable
  )

  if (socialLinks.length === 0) {
    return null
  }

  return (
    <Flex gap='l' alignItems='center'>
      {socialLinks.map((link, index) => {
        const platform = detectPlatform(link)
        const IconComponent = getPlatformIcon(platform)

        return (
          <ExternalLink key={index} to={link}>
            <PlainButton
              size='large'
              iconLeft={() => <IconComponent color='subdued' />}
            />
          </ExternalLink>
        )
      })}
    </Flex>
  )
}

const AssetInfoSectionSkeleton = () => {
  const theme = useTheme()

  return (
    <Paper
      borderRadius='l'
      shadow='far'
      column
      alignItems='flex-start'
      border='default'
    >
      {/* Banner skeleton */}
      <Flex
        column
        alignItems='flex-start'
        alignSelf='stretch'
        border='default'
        h={BANNER_HEIGHT}
        css={{ backgroundColor: theme.color.neutral.n100 }}
      >
        <Flex column alignItems='flex-start' alignSelf='stretch' p='l' gap='s'>
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
      <Flex column alignItems='flex-start' alignSelf='stretch' p='xl' gap='l'>
        <Skeleton width='200px' height='24px' />
        <Flex column gap='m'>
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
  const { data: coin, isLoading } = useArtistCoin(mint)
  const theme = useTheme()
  const { ownerId: ownerIdRaw } = coin ?? {}
  const ownerId =
    typeof ownerIdRaw === 'string' ? HashId.parse(ownerIdRaw) : ownerIdRaw

  const { data: owner } = useUser(ownerId)
  const { image: coverPhoto } = useCoverPhoto({
    userId: ownerId,
    size: WidthSizes.SIZE_640
  })

  if (isLoading || !coin || !owner) {
    return (
      <Flex
        column
        alignItems='flex-start'
        alignSelf='stretch'
        h={BANNER_HEIGHT}
        css={{ backgroundColor: theme.color.neutral.n100 }}
      >
        <Flex column alignItems='flex-start' alignSelf='stretch' p='l' gap='s'>
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
      column
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
      <Flex column alignItems='flex-start' alignSelf='stretch' p='l' gap='s'>
        <Text variant='label' size='m' color='staticWhite' shadow='emphasis'>
          {messages.createdBy}
        </Text>

        {ownerId && <UserTokenBadge userId={ownerId} />}
      </Flex>
    </Flex>
  )
}

type AssetInfoSectionProps = {
  mint: string
}

const { REWARDS_PAGE } = route

type AssetDetailsSectionProps = {
  formattedTotalArtistEarnings: string
  isCoinCreator: boolean
  unclaimedFees: number
  formattedUnclaimedFees: string
  isClaimFeesPending: boolean
  isClaimFeesDisabled: boolean
  handleClaimFees: () => void
}

const AssetDetailsSection = ({
  formattedTotalArtistEarnings,
  isCoinCreator,
  unclaimedFees,
  formattedUnclaimedFees,
  isClaimFeesPending,
  handleClaimFees,
  isClaimFeesDisabled
}: AssetDetailsSectionProps) => {
  return (
    <Flex
      direction='column'
      alignItems='flex-start'
      alignSelf='stretch'
      borderTop='default'
      ph='xl'
      pv='l'
      gap='l'
    >
      <Flex
        alignItems='center'
        justifyContent='space-between'
        alignSelf='stretch'
      >
        <Flex alignItems='center' gap='s'>
          <Text variant='body' size='s' strength='strong'>
            {overflowMessages.vestingSchedule}
          </Text>
          <Tooltip
            text={overflowMessages.tooltips.vestingSchedule}
            mount='body'
          >
            <IconInfo size='s' color='subdued' />
          </Tooltip>
        </Flex>
        <Text variant='body' size='s' color='subdued'>
          {overflowMessages.vestingScheduleValue}
        </Text>
      </Flex>
      <Flex
        alignItems='center'
        justifyContent='space-between'
        alignSelf='stretch'
      >
        <Flex alignItems='center' gap='s'>
          <Text variant='body' size='s' strength='strong'>
            {overflowMessages.artistEarnings}
          </Text>
          <Tooltip text={overflowMessages.tooltips.artistEarnings} mount='body'>
            <IconInfo size='s' color='subdued' />
          </Tooltip>
        </Flex>
        <Text variant='body' size='s' color='subdued'>
          {formattedTotalArtistEarnings} {overflowMessages.$audio}
        </Text>
      </Flex>
      {isCoinCreator ? (
        <Flex
          alignItems='center'
          justifyContent='space-between'
          alignSelf='stretch'
        >
          <Flex alignItems='center' gap='s'>
            <Text variant='body' size='s' strength='strong'>
              {overflowMessages.unclaimedFees}
            </Text>
            <Tooltip
              text={overflowMessages.tooltips.unclaimedFees}
              mount='body'
            >
              <IconInfo size='s' color='subdued' />
            </Tooltip>
          </Flex>
          <Flex alignItems='center' gap='s'>
            {unclaimedFees > 0 ? (
              <Flex gap='xs' alignItems='center'>
                <TextLink
                  onClick={handleClaimFees}
                  variant={isClaimFeesDisabled ? 'subdued' : 'visible'}
                  disabled={isClaimFeesDisabled}
                >
                  {overflowMessages.claim}
                </TextLink>
                {isClaimFeesPending ? (
                  <LoadingSpinner size='s' color='subdued' />
                ) : null}
              </Flex>
            ) : null}

            <Text variant='body' size='s' color='subdued'>
              {formattedUnclaimedFees} {overflowMessages.$audio}
            </Text>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  )
}

export const AssetInfoSection = ({ mint }: AssetInfoSectionProps) => {
  const dispatch = useDispatch()
  const { toast } = useContext(ToastContext)

  const { data: coin, isLoading } = useArtistCoin(mint)

  const { data: currentUser } = useCurrentAccountUser()
  const { data: userCoins } = useUserCoins({ userId: currentUser?.user_id })
  const userToken = useMemo(
    () => userCoins?.find((coin) => coin.mint === mint),
    [userCoins, mint]
  )
  const isCoinCreator = coin?.ownerId === currentUser?.user_id
  const discordOAuthLink = useDiscordOAuthLink(userToken?.ticker)
  const { balance: userTokenBalance } = userToken ?? {}

  // Get wallet addresses for claim fee
  const { data: connectedWallets } = useConnectedWallets()
  const externalSolWallet = useMemo(
    () => getLastConnectedSolWallet(connectedWallets),
    [connectedWallets]
  )

  // Claim fee hook
  const { mutate: claimFees, isPending: isClaimFeesPending } = useClaimFees({
    onSuccess: () => {
      toast(toastMessages.feesClaimed)
    },
    onError: (error) => {
      reportToSentry({
        error,
        feature: Feature.ArtistCoins,
        name: 'Failed to claim artist coin fees',
        additionalInfo: {
          coin,
          tokenMint: mint,
          unclaimedFees,
          totalArtistEarnings
        }
      })
      toast(toastMessages.feesClaimFailed)
    }
  })

  const unclaimedFees = coin?.dynamicBondingCurve?.creatorQuoteFee ?? 0
  const formattedUnclaimedFees = useMemo(() => {
    const value = wAUDIO(BigInt(unclaimedFees))
    const decimalPlaces = getTokenDecimalPlaces(Number(value.toString()))
    return value.trunc(decimalPlaces).toLocaleString('en-US', {
      maximumFractionDigits: decimalPlaces,
      minimumFractionDigits: Math.min(decimalPlaces, 2)
    })
  }, [unclaimedFees])
  const totalArtistEarnings =
    coin?.dynamicBondingCurve?.totalTradingQuoteFee ?? 0
  const formattedTotalArtistEarnings = useMemo(() => {
    // Here we divide by 2 because the artist only gets half of the fees (this value includes the AUDIO network fees)
    const value = wAUDIO(BigInt(Math.trunc(totalArtistEarnings / 2)))
    const decimalPlaces = getTokenDecimalPlaces(Number(value.toString()))
    return value.trunc(decimalPlaces).toLocaleString('en-US', {
      maximumFractionDigits: decimalPlaces,
      minimumFractionDigits: Math.min(decimalPlaces, 2)
    })
  }, [totalArtistEarnings])
  const descriptionParagraphs = coin?.description?.split('\n') ?? []

  const openDiscord = () => {
    window.open(discordOAuthLink, '_blank')
  }

  const handleLearnMore = () => {
    window.open(coin?.website, '_blank')
  }

  const handleBrowseRewards = useCallback(() => {
    dispatch(push(REWARDS_PAGE))
  }, [dispatch])

  const handleCopyAddress = useCallback(() => {
    copyToClipboard(mint)
    toast(overflowMessages.copiedToClipboard)
  }, [mint, toast])

  const handleClaimFees = useCallback(() => {
    if (!externalSolWallet || !mint || !currentUser?.wallet) {
      toast(toastMessages.feesClaimFailed)
      reportToSentry({
        error: new Error('Unknown error while claiming fees'),
        feature: Feature.ArtistCoins,
        name: 'No external Solana wallet connected',
        additionalInfo: {
          coin,
          mint,
          externalSolWallet,
          currentUser
        }
      })
      return
    }

    claimFees({
      tokenMint: mint,
      ownerWalletAddress: externalSolWallet.address,
      ownerEthAddress: currentUser.wallet!
    })
  }, [externalSolWallet, mint, currentUser, claimFees, toast, coin])

  if (isLoading || !coin) {
    return <AssetInfoSectionSkeleton />
  }

  const isWAudio = coin.mint === env.WAUDIO_MINT_ADDRESS
  const CTAIcon = isWAudio ? IconGift : IconExternalLink

  const isUserBalanceUnavailable =
    !userTokenBalance || Number(userTokenBalance) <= 0

  return (
    <Paper
      borderRadius='l'
      shadow='far'
      column
      alignItems='flex-start'
      border='default'
    >
      <BannerSection mint={mint} />

      {coin.description ? (
        <Flex
          column
          alignItems='flex-start'
          alignSelf='stretch'
          ph='xl'
          pv='l'
          gap='l'
        >
          <Flex column gap='m'>
            <SocialLinksDisplay coin={coin} />
            {descriptionParagraphs.map((paragraph) => {
              if (paragraph.trim() === '') {
                return null
              }

              return (
                <UserGeneratedText
                  key={paragraph.slice(0, 10)}
                  variant='body'
                  size='m'
                  color='subdued'
                >
                  {paragraph}
                </UserGeneratedText>
              )
            })}
          </Flex>
        </Flex>
      ) : null}

      {isWAudio || coin.website ? (
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
            >
              {isWAudio ? messages.browseRewards : messages.learnMore}
            </PlainButton>
          </Flex>
        </Flex>
      ) : null}
      {userToken?.hasDiscord ? (
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
                  disabled={isUserBalanceUnavailable}
                >
                  {messages.openDiscord}
                </PlainButton>
              </Flex>
            )}
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
        <PlainButton
          onClick={handleCopyAddress}
          iconLeft={IconCopy}
          variant='default'
        >
          {overflowMessages.copyCoinAddress}
        </PlainButton>
        <Text variant='body' size='m' color='subdued'>
          {shortenSPLAddress(mint)}
        </Text>
      </Flex>
      {!isWAudio ? (
        <AssetDetailsSection
          formattedTotalArtistEarnings={formattedTotalArtistEarnings}
          isCoinCreator={isCoinCreator}
          unclaimedFees={unclaimedFees}
          formattedUnclaimedFees={formattedUnclaimedFees}
          isClaimFeesPending={isClaimFeesPending}
          isClaimFeesDisabled={isClaimFeesPending || !externalSolWallet}
          handleClaimFees={handleClaimFees}
        />
      ) : null}
    </Paper>
  )
}
