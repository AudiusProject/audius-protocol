import { useCallback } from 'react'

import {
  accountSelectors,
  profilePageSelectors,
  tippingActions
} from '@audius/common'
import { Button, ButtonType } from '@audius/stems'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import IconGoldBadge from 'assets/img/tokenBadgeGold40@2x.png'
import { useSelector } from 'common/hooks/useSelector'
import { showRequiresAccountModal } from 'common/store/pages/signon/actions'
import { SIGN_UP_PAGE } from 'utils/route'

import styles from './TipAudio.module.css'
const { beginTip } = tippingActions
const { getProfileUser } = profilePageSelectors
const getAccountUser = accountSelectors.getAccountUser

const messages = {
  tipAudio: 'Tip $AUDIO'
}

export const TipAudioButton = () => {
  const dispatch = useDispatch()
  const profile = useSelector(getProfileUser)
  const account = useSelector(getAccountUser)

  const handleClick = useCallback(() => {
    if (account) {
      dispatch(beginTip({ user: profile, source: 'profile' }))
    } else {
      dispatch(pushRoute(SIGN_UP_PAGE))
      dispatch(showRequiresAccountModal())
    }
  }, [dispatch, profile, account])

  return (
    <Button
      className={cn(styles.button, styles.tipAudioButton)}
      type={ButtonType.PRIMARY}
      text={
        <div className={styles.tipIconTextContainer}>
          <img
            draggable={false}
            alt=''
            src={IconGoldBadge as string}
            width={24}
            height={24}
          />
          <span className={styles.tipText}>{messages.tipAudio}</span>
        </div>
      }
      onClick={handleClick}
    />
  )
}
