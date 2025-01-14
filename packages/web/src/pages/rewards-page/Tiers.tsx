import { ReactElement, useCallback, useEffect, useMemo } from 'react'

import { useSelectTierInfo } from '@audius/common/hooks'
import { BadgeTier } from '@audius/common/models'
import {
  accountSelectors,
  badgeTiers,
  getTierNumber,
  vipDiscordModalActions,
  musicConfettiActions
} from '@audius/common/store'
import { formatNumberCommas, Nullable } from '@audius/common/utils'
import {
  IconTokenBronze,
  IconTokenGold,
  IconTokenPlatinum,
  IconTokenSilver,
  IconDiscord,
  Button,
  Text,
  Flex,
  IconValidationCheck,
  IconRefresh,
  useTheme
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { Tooltip } from 'components/tooltip'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { useSelector } from 'utils/reducer'

import styles from './Tiers.module.css'
const { show } = musicConfettiActions
const { pressDiscord } = vipDiscordModalActions
const { getUserId } = accountSelectors

const messages = {
  title: 'Reward Perks',
  subtitle: 'Keep $AUDIO in your wallet to enjoy perks and exclusive features.',
  noTier: 'No tier',
  currentTier: 'CURRENT TIER',
  tierLevel: (amount: string) => `${Number(amount).toLocaleString()}+`,
  updateRole: 'Update Role',
  features: {
    balance: '$AUDIO Balance',
    hqStreaming: 'HQ Streaming',
    unlimitedUploads: 'Unlimited Uploads',
    uploadOnMobile: 'Upload On Mobile',
    offlineListening: 'Offline Listening',
    gatedContent: 'Gated Content',
    directMessaging: 'Direct Messaging',
    nftGallery: 'NFT Collectibles Gallery',
    messageBlasts: 'Message Blasts',
    flairBadges: 'Flair Badges',
    customDiscordRole: 'Custom Discord Role',
    customThemes: 'Custom App Themes'
  },
  learnMore: 'Learn more',
  launchDiscord: 'Launch the VIP Discord',
  refreshDiscordRole: 'Refresh Discord role',
  tierNumber: (tier: number) => `TIER ${tier}`
}

const BADGE_SIZE = 24

type AudioTiers = Exclude<BadgeTier, 'none'>

// Tiers as they are listed here, in order
const tiers: AudioTiers[] = ['bronze', 'silver', 'gold', 'platinum']

// Mapping for large icons
const audioTierMapSvg: {
  [tier in AudioTiers]: Nullable<ReactElement>
} = {
  bronze: <IconTokenBronze width={BADGE_SIZE} height={BADGE_SIZE} />,
  silver: <IconTokenSilver width={BADGE_SIZE} height={BADGE_SIZE} />,
  gold: <IconTokenGold width={BADGE_SIZE} height={BADGE_SIZE} />,
  platinum: <IconTokenPlatinum width={BADGE_SIZE} height={BADGE_SIZE} />
}

const BADGE_LOCAL_STORAGE_KEY = 'last_badge_tier'

const LEARN_MORE_URL = 'http://blog.audius.co/posts/community-meet-audio'

const useShowConfetti = (tier: BadgeTier) => {
  // No tier or no local storage, never show confetti
  if (tier === 'none' || !window.localStorage) return false

  const lastBadge = window.localStorage.getItem(BADGE_LOCAL_STORAGE_KEY) as
    | BadgeTier
    | undefined

  // set last tier
  window.localStorage.setItem(BADGE_LOCAL_STORAGE_KEY, tier)

  // if we just got our first tier, always show confetti
  if (!lastBadge) return true

  const [oldTierNum, newTierNum] = [
    getTierNumber(lastBadge),
    getTierNumber(tier)
  ]

  return newTierNum > oldTierNum
}

/** Renders out the level # associated with a given tier */
export const TierNumber = ({ tier }: { tier: AudioTiers }) => {
  const tierNumber = tiers.findIndex((t) => t === tier) + 1
  return (
    <span className={styles.tierNumberText}>
      {messages.tierNumber(tierNumber)}
    </span>
  )
}

/** Renders out level of audio required for a tier - e.g. '1000+ $AUDIO */
export const TierLevel = ({ tier }: { tier: AudioTiers }) => {
  const minAudio = useMemo(
    () => badgeTiers.find((b) => b.tier === tier)?.minAudio.toString() ?? '',
    [tier]
  )
  return <div className={styles.tierLevel}>{messages.tierLevel(minAudio)}</div>
}

const TierBox = ({ tier, message }: { tier: BadgeTier; message?: string }) => {
  return (
    <Flex direction='column' alignItems='center' gap='s' mb='s'>
      <Flex>
        {tier !== 'none' ? (
          audioTierMapSvg[tier as AudioTiers]
        ) : (
          <Flex h={BADGE_SIZE} w={BADGE_SIZE} />
        )}
      </Flex>
      <Text
        variant='title'
        size='m'
        color='default'
        textTransform='capitalize'
        css={{
          minHeight: '1.5em',
          ...(tier !== 'none' && {
            WebkitTextFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            backgroundImage:
              tier === 'bronze'
                ? 'linear-gradient(to right, rgba(141, 48, 8, 0.5), rgb(182, 97, 11))'
                : tier === 'silver'
                  ? 'linear-gradient(to right, rgba(179, 182, 185, 0.5), rgb(189, 189, 189))'
                  : tier === 'gold'
                    ? 'linear-gradient(to right, rgb(236, 173, 11), rgb(236, 173, 11))'
                    : tier === 'platinum'
                      ? 'linear-gradient(to right, rgb(179, 236, 249), rgb(87, 194, 215))'
                      : 'inherit'
          })
        }}
      >
        {tier !== 'none' ? tier : message}
      </Text>
    </Flex>
  )
}

const tierFeatureMap: Record<
  AudioTiers | 'none',
  Record<keyof typeof messages.features, boolean>
> = {
  none: {
    balance: true,
    hqStreaming: true,
    unlimitedUploads: true,
    uploadOnMobile: true,
    offlineListening: true,
    gatedContent: true,
    directMessaging: true,
    nftGallery: true,
    messageBlasts: false,
    flairBadges: false,
    customDiscordRole: false,
    customThemes: false
  },
  bronze: {
    balance: true,
    hqStreaming: true,
    unlimitedUploads: true,
    uploadOnMobile: true,
    offlineListening: true,
    gatedContent: true,
    directMessaging: true,
    nftGallery: true,
    messageBlasts: true,
    flairBadges: true,
    customDiscordRole: true,
    customThemes: false
  },
  silver: {
    balance: true,
    hqStreaming: true,
    unlimitedUploads: true,
    uploadOnMobile: true,
    offlineListening: true,
    gatedContent: true,
    directMessaging: true,
    nftGallery: true,
    messageBlasts: true,
    flairBadges: true,
    customDiscordRole: true,
    customThemes: false
  },
  gold: {
    balance: true,
    hqStreaming: true,
    unlimitedUploads: true,
    uploadOnMobile: true,
    offlineListening: true,
    gatedContent: true,
    directMessaging: true,
    nftGallery: true,
    messageBlasts: true,
    flairBadges: true,
    customDiscordRole: true,
    customThemes: true
  },
  platinum: {
    balance: true,
    hqStreaming: true,
    unlimitedUploads: true,
    uploadOnMobile: true,
    offlineListening: true,
    gatedContent: true,
    directMessaging: true,
    nftGallery: true,
    messageBlasts: true,
    flairBadges: true,
    customDiscordRole: true,
    customThemes: true
  }
}

const TierColumn = ({
  tier,
  current
}: {
  tier: BadgeTier
  current?: boolean
}) => {
  const { color } = useTheme()
  const dispatch = useDispatch()
  const onClickDiscord = useCallback(() => dispatch(pressDiscord()), [dispatch])

  const tierFeatures =
    tier !== 'none' ? tierFeatureMap[tier] : tierFeatureMap.none

  return (
    <Flex
      direction='column'
      border={current ? 'strong' : undefined}
      borderRadius={current ? 'm' : undefined}
      shadow={current ? 'mid' : undefined}
      css={{
        overflow: 'hidden',
        minWidth: '120px',
        '@media (max-width: 1100px)': {
          display: current ? 'flex' : 'none'
        }
      }}
      mt={current ? '-49px' : undefined} // Move current tier up to align columns
    >
      {current && (
        <Flex
          justifyContent='center'
          pv='m'
          mb='m'
          css={{ background: 'var(--harmony-gradient)' }}
        >
          <Text variant='label' size='s' color='staticWhite'>
            {messages.currentTier}
          </Text>
        </Flex>
      )}
      <TierBox
        tier={tier as AudioTiers}
        message={tier === 'none' ? messages.noTier : undefined}
      />
      {(
        Object.keys(messages.features) as Array<keyof typeof messages.features>
      ).map((feature) => {
        const minAudio =
          badgeTiers.find((b) => b.tier === tier)?.minAudio.toString() ?? '0'

        return (
          <Flex
            key={feature}
            pv='m'
            borderTop='default'
            justifyContent='center'
          >
            <Text>
              {feature === 'balance' ? (
                <Flex h={24} alignItems='center' justifyContent='center'>
                  {minAudio !== '0' ? (
                    <Text
                      variant='label'
                      size='s'
                    >{`${formatNumberCommas(minAudio)}+`}</Text>
                  ) : null}
                </Flex>
              ) : tierFeatures[feature] ? (
                <Flex h={24} direction='row' alignItems='center' gap='m'>
                  <IconValidationCheck />
                  {feature === 'customDiscordRole' && current ? (
                    <Tooltip text={messages.refreshDiscordRole}>
                      <Button
                        size='small'
                        variant='secondary'
                        iconLeft={IconRefresh}
                        onClick={onClickDiscord}
                      />
                    </Tooltip>
                  ) : null}
                </Flex>
              ) : (
                <Flex h={24} w={24} alignItems='center' justifyContent='center'>
                  <Flex
                    h={16}
                    w={16}
                    borderRadius='circle'
                    border='strong'
                    css={{
                      borderWidth: 2,
                      borderColor: color.border.default
                    }}
                  />
                </Flex>
              )}
            </Text>
          </Flex>
        )
      })}
    </Flex>
  )
}

const TierTable = ({ tier }: { tier: BadgeTier }) => {
  return (
    <Flex w='100%' justifyContent='space-between' p='xl'>
      <Flex direction='column' flex='1 1 300px'>
        <TierBox tier='none' />
        {Object.values(messages.features).map((feature) => (
          <Flex
            key={feature}
            pv='m'
            borderTop='default'
            justifyContent='flex-end'
            pr='xl'
          >
            <Text variant='title' size='m' color='default' ellipses>
              {feature}
            </Text>
          </Flex>
        ))}
      </Flex>
      {(['none', 'bronze', 'silver', 'gold', 'platinum'] as BadgeTier[]).map(
        (displayTier) => (
          <Flex key={displayTier} direction='column' flex='1 1 200px'>
            <TierColumn tier={displayTier} current={displayTier === tier} />
          </Flex>
        )
      )}
    </Flex>
  )
}

/** Tile with multiple tiers */
const Tiers = () => {
  const accountUserId = useSelector(getUserId)
  const userId = accountUserId ?? 0
  const { tier } = useSelectTierInfo(userId)

  const dispatch = useDispatch()
  const onClickDiscord = useCallback(() => dispatch(pressDiscord()), [dispatch])
  const onClickExplainMore = useCallback(() => {
    window.open(LEARN_MORE_URL, '_blank')
  }, [])

  const showConfetti = useShowConfetti(tier)
  useEffect(() => {
    if (showConfetti) {
      dispatch(show())
    }
  }, [showConfetti, dispatch])

  const wm = useWithMobileStyle(styles.mobile)

  return (
    <div className={styles.container}>
      <div className={wm(styles.titleContainer)}>
        <Text variant='display' size='s' className={wm(styles.title)}>
          {messages.title}
        </Text>
        <Text variant='body' strength='strong' size='l'>
          {messages.subtitle}
        </Text>
      </div>
      <TierTable tier={tier} />
      <div className={wm(styles.buttonContainer)}>
        <Button variant='secondary' onClick={onClickExplainMore}>
          {messages.learnMore}
        </Button>
        <Button
          variant='secondary'
          iconLeft={IconDiscord}
          onClick={onClickDiscord}
        >
          {messages.launchDiscord}
        </Button>
      </div>
    </div>
  )
}

export default Tiers
