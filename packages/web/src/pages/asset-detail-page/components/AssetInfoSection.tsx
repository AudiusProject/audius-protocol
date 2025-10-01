import { useCallback, useContext, useMemo } from 'react'

import {
  useArtistCoin,
  useCurrentUserId,
  useUser,
  useUserCoins,
  useConnectedWallets,
  useWalletAddresses,
  useCurrentAccountUser
} from '@audius/common/api'
import { useDiscordOAuthLink } from '@audius/common/hooks'
import { coinDetailsMessages } from '@audius/common/messages'
import { WidthSizes } from '@audius/common/models'
import { route, shortenSPLAddress } from '@audius/common/utils'
import {
  Button,
  Flex,
  IconCopy,
  IconDiscord,
  IconExternalLink,
  IconGift,
  IconInfo,
  Paper,
  PlainButton,
  Text,
  TextLink,
  useTheme
} from '@audius/harmony'
import { HashId } from '@audius/sdk'
import { useDispatch } from 'react-redux'

import Skeleton from 'components/skeleton/Skeleton'
import { ToastContext } from 'components/toast/ToastContext'
import Tooltip from 'components/tooltip/Tooltip'
import { UserTokenBadge } from 'components/user-token-badge/UserTokenBadge'
import { useClaimFee } from 'hooks/useClaimFee'
import { useCoverPhoto } from 'hooks/useCoverPhoto'
import { getLastConnectedSolWallet } from 'pages/artist-coins-launchpad-page/utils'
import { env } from 'services/env'
import { copyToClipboard } from 'utils/clipboardUtil'
import { push } from 'utils/navigation'

const messages = coinDetailsMessages.coinInfo
const overflowMessages = coinDetailsMessages.overflowMenu

const BANNER_HEIGHT = 120

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
  const { mutate: claimFee, isPending: isClaimFeePending } = useClaimFee({
    onSuccess: (data) => {
      toast('Fees claimed successfully!')
      // eslint-disable-next-line no-console
      console.log('Claim fee transaction signature:', data.signature)
    },
    onError: (error) => {
      toast(`Failed to claim fees: ${error.message}`)
    }
  })
  const unclaimedFees = coin?.unclaimedFees ?? 0.01 // TODO: get this working on api side

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
    if (!externalSolWallet) {
      toast('Please connect your wallet to claim fees')
      return
    }

    if (!mint) {
      toast('Invalid token mint address')
      return
    }

    if (!currentUser?.spl_wallet) {
      toast('Something went wrong')
      return
    }

    claimFee({
      tokenMint: mint,
      ownerWalletAddress: externalSolWallet.address,
      receiverWalletAddress: currentUser.spl_wallet // Using same wallet for owner and receiver
    })
  }, [externalSolWallet, mint, claimFee, currentUser?.spl_wallet, toast])

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
        <Flex column alignItems='flex-start' alignSelf='stretch' p='xl' gap='l'>
          <Flex column gap='m'>
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
      {isCoinCreator ? (
        <Flex
          alignItems='center'
          justifyContent='space-between'
          alignSelf='stretch'
          p='l'
          borderTop='default'
        >
          <Flex alignItems='center' gap='s'>
            <Text variant='body' size='s' strength='strong'>
              {overflowMessages.unclaimedFees}
            </Text>
            <Tooltip text={overflowMessages.unclaimedFees}>
              <IconInfo size='s' color='subdued' />
            </Tooltip>
          </Flex>
          <Flex alignItems='center' gap='s'>
            {unclaimedFees > 0 ? (
              <TextLink
                onClick={handleClaimFees}
                variant={isClaimFeePending ? 'subdued' : 'visible'}
                disabled={
                  isClaimFeePending ||
                  !externalSolWallet ||
                  !currentUser?.spl_wallet
                }
              >
                {overflowMessages.claim}
              </TextLink>
            ) : null}
            <Text variant='body' size='s' color='subdued'>
              ${unclaimedFees}
            </Text>
          </Flex>
        </Flex>
      ) : null}
    </Paper>
  )
}
