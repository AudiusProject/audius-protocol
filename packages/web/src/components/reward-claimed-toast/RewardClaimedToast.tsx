import { useContext, useEffect } from 'react'

import {
  audioRewardsPageSelectors,
  audioRewardsPageActions
} from '@audius/common/store'

import { useDispatch, useSelector } from 'react-redux'

import IconCaretRight from 'assets/img/iconCaretRight.svg'
import { ToastContext } from 'components/toast/ToastContext'
import ToastLinkContent from 'components/toast/mobile/ToastLinkContent'
import { getLocationPathname } from 'store/routing/selectors'
import { CLAIM_REWARD_TOAST_TIMEOUT_MILLIS } from 'utils/constants'
import { AUDIO_PAGE } from 'utils/route'

import styles from './RewardClaimedToast.module.css'
const { getShowRewardClaimedToast } = audioRewardsPageSelectors
const { resetRewardClaimedToast } = audioRewardsPageActions

const messages = {
  challengeCompleted: 'You’ve Completed an $AUDIO Rewards Challenge!',
  seeMore: 'See more'
}

export const RewardClaimedToast = () => {
  const { toast } = useContext(ToastContext)
  const dispatch = useDispatch()
  const showToast = useSelector(getShowRewardClaimedToast)
  const pathname = useSelector(getLocationPathname)

  useEffect(() => {
    if (showToast) {
      const toastContent = (
        <div className={styles.rewardClaimedToast}>
          <span className={styles.rewardClaimedToastIcon}>
            <i className='emoji face-with-party-horn-and-party-hat' />
          </span>
          {pathname === AUDIO_PAGE ? (
            messages.challengeCompleted
          ) : (
            <ToastLinkContent
              text={messages.challengeCompleted}
              linkText={messages.seeMore}
              link={AUDIO_PAGE}
              linkIcon={<IconCaretRight className={styles.seeMoreCaret} />}
            />
          )}
        </div>
      )

      toast(toastContent, CLAIM_REWARD_TOAST_TIMEOUT_MILLIS)
      dispatch(resetRewardClaimedToast())
    }
  }, [toast, dispatch, showToast, pathname])

  return null
}
