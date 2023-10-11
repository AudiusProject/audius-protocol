import { cloneElement, useCallback, useMemo } from 'react'

import {
  BadgeTier,
  BNWei,
  StringKeys,
  formatWei,
  accountSelectors,
  audioRewardsPageSelectors,
  walletSelectors,
  useSelectTierInfo,
  useAccountHasClaimableRewards
} from '@audius/common'
import BN from 'bn.js'
import cn from 'classnames'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { animated, Transition } from 'react-spring/renderprops'

import { ReactComponent as IconCaretRight } from 'assets/img/iconCaretRight.svg'
import IconNoTierBadge from 'assets/img/tokenBadgeNoTier.png'
import Skeleton from 'components/skeleton/Skeleton'
import { audioTierMapPng } from 'components/user-badges/UserBadges'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useRemoteVar } from 'hooks/useRemoteConfig'
import { useSelector } from 'utils/reducer'
import { AUDIO_PAGE } from 'utils/route'

import styles from './NavAudio.module.css'
const { getAccountTotalBalance, getAccountBalanceLoading } = walletSelectors
const getAccountUser = accountSelectors.getAccountUser
const { getUserChallengesLoading } = audioRewardsPageSelectors

type BubbleType = 'none' | 'claim' | 'earn'

const messages = {
  earnAudio: 'EARN $AUDIO',
  claimRewards: 'Claim Rewards'
}

type RewardsActionBubbleProps = {
  bubbleType: BubbleType
  onClick(): void
  style?: React.CSSProperties
}

const RewardsActionBubble = ({
  bubbleType,
  onClick,
  style
}: RewardsActionBubbleProps) => {
  if (bubbleType === 'none') {
    return null
  }
  return (
    <animated.span
      style={style}
      className={cn(styles.actionBubble, styles.interactive, {
        [styles.claimRewards]: bubbleType === 'claim'
      })}
      onClick={onClick}
    >
      <span>
        {bubbleType === 'claim' ? messages.claimRewards : messages.earnAudio}
      </span>
      <IconCaretRight className={styles.actionCaret} />
    </animated.span>
  )
}

/**
 * Pulls balances from account and wallet selectors. Will prefer the wallet
 * balance once it has loaded. Otherwise, will return the account balance if
 * available. Falls back to 0 if neither wallet or account balance are available.
 */
const useTotalBalanceWithFallback = () => {
  const account = useSelector(getAccountUser)
  const walletTotalBalance = useSelector(getAccountTotalBalance)

  return useMemo(() => {
    if (walletTotalBalance != null) {
      return walletTotalBalance
    } else if (account?.total_balance != null) {
      return new BN(account.total_balance) as BNWei
    }

    return null
  }, [account, walletTotalBalance])
}

const NavAudio = () => {
  const userChallengesLoading = useSelector(getUserChallengesLoading)
  const balanceLoading = useSelector(getAccountBalanceLoading)
  const account = useSelector(getAccountUser)
  const navigate = useNavigateToPage()

  const totalBalance = useTotalBalanceWithFallback()
  const positiveTotalBalance =
    totalBalance != null ? totalBalance.gt(new BN(0)) : false

  // we only show the audio balance and respective badge when there is an account
  // so below null-coalescing is okay
  const { tier } = useSelectTierInfo(account?.user_id ?? 0)
  const audioBadge = audioTierMapPng[tier as BadgeTier]

  const challengeRewardIds = useRemoteVar(StringKeys.CHALLENGE_REWARD_IDS)
  const hasClaimableRewards = useAccountHasClaimableRewards(challengeRewardIds)

  const goToAudioPage = useCallback(() => {
    navigate(AUDIO_PAGE)
  }, [navigate])

  if (!account) {
    return null
  }

  let bubbleType: BubbleType = 'none'
  /*
   * Logic here is:
   * - If user challenges have loaded and there are some to claim, show that immediately
   * - Otherwise, once wallet AND challenges have loaded (to prevent flashing),
   *   show the "earn" variant if the balance is zero.
   * - Fall back to "none" (hidden)
   */
  if (hasClaimableRewards && !userChallengesLoading) {
    bubbleType = 'claim'
  } else if (
    !positiveTotalBalance &&
    !balanceLoading &&
    !userChallengesLoading
  ) {
    bubbleType = 'earn'
  }

  return (
    <div className={styles.audio}>
      <div
        className={cn(styles.amountContainer, styles.interactive, {
          [styles.hasBalance]: positiveTotalBalance
        })}
        onClick={goToAudioPage}
      >
        {positiveTotalBalance && audioBadge ? (
          cloneElement(audioBadge, {
            height: 16,
            width: 16
          })
        ) : (
          <img alt='no tier' src={IconNoTierBadge} width='16' height='16' />
        )}
        {totalBalance == null ? (
          <Skeleton width='30px' height='14px' className={styles.skeleton} />
        ) : (
          <span className={styles.audioAmount}>
            {formatWei(totalBalance, true, 0)}
          </span>
        )}
      </div>
      <div className={styles.bubbleContainer}>
        <Transition
          items={bubbleType}
          from={{ opacity: 0 }}
          enter={{ opacity: 1 }}
          leave={{ opacity: 0 }}
          config={{ duration: 100 }}
        >
          {(bubbleType) => (style) =>
            (
              <RewardsActionBubble
                bubbleType={bubbleType}
                style={style}
                onClick={goToAudioPage}
              />
            )}
        </Transition>
      </div>
    </div>
  )
}

export default NavAudio
