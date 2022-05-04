import React, { useCallback } from 'react'

import { Button, ButtonType } from '@audius/stems'
import { useDispatch } from 'react-redux'

import { ReactComponent as IconGoldBadgeSVG } from 'assets/img/IconGoldBadge.svg'
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
    dispatch(beginTip({ user: profile }))
  }, [dispatch, profile])

  return (
    <Button
      className={styles.button}
      type={ButtonType.PRIMARY}
      text={
        <div className={styles.tipIconTextContainer}>
          <IconGoldBadgeSVG width={24} height={24} />
          <span className={styles.tipText}>{messages.tipAudio}</span>
        </div>
      }
      onClick={handleClick}
    />
  )
}
