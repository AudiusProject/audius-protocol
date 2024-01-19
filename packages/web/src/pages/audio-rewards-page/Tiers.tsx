import { ReactElement, useCallback, useEffect, useMemo } from 'react'

import {
  BadgeTier,
  Nullable,
  accountSelectors,
  badgeTiers,
  getTierNumber,
  vipDiscordModalActions,
  musicConfettiActions,
  useSelectTierInfo
} from '@audius/common'
import { Button, ButtonType, IconDiscord } from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import IconArrow from 'assets/img/iconArrowGrey.svg'
import IconBronzeBadge from 'assets/img/tokenBadgeBronze108@2x.png'
import IconGoldBadge from 'assets/img/tokenBadgeGold108@2x.png'
import IconPlatinumBadge from 'assets/img/tokenBadgePlatinum108@2x.png'
import IconSilverBadge from 'assets/img/tokenBadgeSilver108@2x.png'
import { BadgeTierText } from 'components/user-badges/ProfilePageBadge'
import { useIsMobile } from 'hooks/useIsMobile'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { useSelector } from 'utils/reducer'

import styles from './Tiers.module.css'
const { show } = musicConfettiActions
const { pressDiscord } = vipDiscordModalActions
const getAccountUser = accountSelectors.getAccountUser

const messages = {
  title: '$AUDIO VIP TIERS',
  subtitle1: `Unlock $AUDIO VIP Tiers by simply holding more $AUDIO!`,
  subtitle2: `Advancing to a new tier will earn your profile a badge, visible throughout the app, and unlock various new features as they are released.`,
  unlocks: 'UNLOCKS',
  badgeType: (badge: string) => `${badge} Badge`,
  badgeRole: (badge: string) => `${badge} Discord Role`,
  moreSoon: 'More Coming Soon!',
  updateRole: 'UPDATE ROLE',
  tierNumber: (tier: number) => `TIER ${tier}`,
  currentTier: 'CURRENT TIER',
  learnMore: 'LEARN MORE',
  launchDiscord: 'LAUNCH THE VIP DISCORD',
  tierLevel: (amount: string) => `${Number(amount).toLocaleString()}+ $AUDIO`,
  matrixMode: 'Matrix Mode',
  collectibles: 'NFT Collectibles'
}

type AudioTiers = Exclude<BadgeTier, 'none'>

// Tiers as they are listed here, in order
const tiers: AudioTiers[] = ['bronze', 'silver', 'gold', 'platinum']

// Mapping for large icons
export const audioTierMapPng: {
  [tier in AudioTiers]: Nullable<ReactElement>
} = {
  bronze: <img alt='bronze' src={IconBronzeBadge} />,
  silver: <img alt='silver' src={IconSilverBadge} />,
  gold: <img alt='gold' src={IconGoldBadge} />,
  platinum: <img alt='platinum' src={IconPlatinumBadge} />
}

const BADGE_LOCAL_STORAGE_KEY = 'last_badge_tier'

export const LEARN_MORE_URL = 'http://blog.audius.co/posts/community-meet-audio'

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

type TierProps = {
  isActive?: boolean
  tier: AudioTiers
  isCompact?: boolean
  onClickDiscord?: () => void
}

/** Shows info about a tier - badge, level, tier # */
export const Tier = ({
  tier,
  isActive = false,
  isCompact = false,
  onClickDiscord = () => {}
}: TierProps) => {
  const badgeImage = audioTierMapPng[tier]

  return (
    <div
      className={cn(styles.tierContainerWrapper, {
        [styles.tierContainerActive]: isActive,
        [styles.compact]: isCompact
      })}
    >
      {isActive && (
        <div className={styles.currentTier}>
          {messages.currentTier}
          <div className={styles.arrowWrapper}>
            <IconArrow />
          </div>
        </div>
      )}
      <div
        className={cn(
          styles.tierContainer,
          {
            [styles.tierContainerActive]: isActive
          },
          {
            [styles.compact]: isCompact
          }
        )}
      >
        <TierNumber tier={tier} />
        <BadgeTierText
          tier={tier}
          fontSize={28}
          className={styles.badgeTierText}
        />
        <TierLevel tier={tier} />
        <div className={styles.divider} />
        <div className={styles.imageWrapper}>{badgeImage}</div>
        {!isCompact && (
          <>
            <div className={styles.unlocks}>{messages.unlocks}</div>
            <div className={styles.tierTextContainer}>
              <span>
                <i className='emoji large white-heavy-check-mark' />
                {messages.badgeType(tier)}
              </span>
              <span>
                <i className='emoji large white-heavy-check-mark' />
                {messages.badgeRole(tier)}
              </span>
              {(tier === 'silver' ||
                tier === 'gold' ||
                tier === 'platinum') && (
                <span>
                  <i className='emoji large framed-picture' />
                  {messages.collectibles}
                </span>
              )}
              {(tier === 'gold' || tier === 'platinum') && (
                <span>
                  <i className='emoji large rabbit' />
                  <i className='emoji large hole' />
                  {messages.matrixMode}
                </span>
              )}
              {isActive && (
                <Button
                  text={messages.updateRole}
                  type={ButtonType.GLASS}
                  leftIcon={<IconDiscord className={styles.iconDiscord} />}
                  className={cn(styles.discordButton, styles.updateRole)}
                  textClassName={styles.discordButtonText}
                  onClick={onClickDiscord}
                />
              )}
              <span className={styles.sparkles}>
                <i className='emoji large sparkles' />
                {messages.moreSoon}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** Tile with multiple tiers */
const Tiers = () => {
  const accountUser = useSelector(getAccountUser)
  const userId = accountUser?.user_id ?? 0
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

  const isMobile = useIsMobile()

  return (
    <div className={styles.container}>
      <div className={wm(styles.tileContainerWrapper)}></div>
      <div className={wm(styles.titleContainer)}>
        <div className={wm(styles.title)}>{messages.title}</div>
        <div className={wm(styles.subtitle)}>{messages.subtitle1}</div>
        <div className={wm(styles.subtitle)}>{messages.subtitle2}</div>
      </div>
      <div className={wm(styles.tiersContainer)}>
        {tiers.map((t) => (
          <Tier
            tier={t}
            isActive={tier === t}
            key={t}
            onClickDiscord={onClickDiscord}
            isCompact={isMobile}
          />
        ))}
      </div>
      <div className={wm(styles.buttonContainer)}>
        <Button
          text={messages.learnMore}
          type={ButtonType.GLASS}
          className={styles.discordButton}
          textClassName={styles.discordButtonText}
          onClick={onClickExplainMore}
        />
        <Button
          text={messages.launchDiscord}
          type={ButtonType.GLASS}
          leftIcon={<IconDiscord className={styles.iconDiscord} />}
          className={styles.discordButton}
          textClassName={styles.discordButtonText}
          onClick={onClickDiscord}
        />
      </div>
    </div>
  )
}

export default Tiers
