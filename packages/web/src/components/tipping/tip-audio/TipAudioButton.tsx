import React, { useCallback } from 'react'

import { Button, ButtonType } from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import IconGoldBadge from 'assets/img/tokenBadgeGold40@2x.png'
import { useSelector } from 'common/hooks/useSelector'
import { getProfileUser } from 'common/store/pages/profile/selectors'
import { beginTip } from 'common/store/tipping/slice'

import styles from './TipAudio.module.css'

const messages = {
  tipAudio: 'Tip $AUDIO'
}

export const TipAudioButton = () => {
  const dispatch = useDispatch()
  const profile = useSelector(getProfileUser)

  const handleClick = useCallback(() => {
    dispatch(beginTip({ user: profile, source: 'profile' }))
  }, [dispatch, profile])

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
