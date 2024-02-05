import { profilePageSelectors, tippingActions } from '@audius/common/store'
import { IconTokenGold } from '@audius/harmony'
import { Button, ButtonType } from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import { useAuthenticatedCallback } from 'hooks/useAuthenticatedCallback'

import styles from './TipAudio.module.css'
const { beginTip } = tippingActions
const { getProfileUser } = profilePageSelectors

const messages = {
  tipAudio: 'Tip $AUDIO'
}

export const TipAudioButton = () => {
  const dispatch = useDispatch()
  const profile = useSelector(getProfileUser)

  const handleClick = useAuthenticatedCallback(() => {
    dispatch(beginTip({ user: profile, source: 'profile' }))
  }, [dispatch, profile])

  return (
    <Button
      className={cn(styles.button, styles.tipAudioButton)}
      type={ButtonType.PRIMARY}
      text={
        <div className={styles.tipIconTextContainer}>
          <IconTokenGold size='l' />
          <span className={styles.tipText}>{messages.tipAudio}</span>
        </div>
      }
      onClick={handleClick}
    />
  )
}
