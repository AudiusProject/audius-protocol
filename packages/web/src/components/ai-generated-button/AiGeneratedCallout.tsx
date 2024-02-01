import { useCallback } from 'react'

import { IconArrowRight as IconArrow, IconRobot } from '@audius/harmony'
import { Button, ButtonType } from '@audius/stems'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { profilePageAiAttributedTracks } from 'utils/route'

import styles from './AiGeneratedCallout.module.css'

const messages = {
  title: 'AI Generated Tracks',
  description: 'AI made music, designed to imitate this artist.',
  listenNow: 'Listen now'
}

export const AiGeneratedCallout = ({ handle }: { handle: string }) => {
  const dispatch = useDispatch()

  const handleClick = useCallback(() => {
    dispatch(pushRoute(profilePageAiAttributedTracks(handle)))
  }, [dispatch, handle])

  return (
    <div className={styles.root} onClick={handleClick}>
      <div className={styles.title}>
        <IconRobot className={styles.iconRobot} />
        {messages.title}
      </div>
      <div className={styles.body}>
        <div className={styles.description}>{messages.description}</div>
        <Button
          className={styles.button}
          type={ButtonType.TEXT}
          rightIcon={<IconArrow className={styles.iconArrow} />}
          text={<div className={styles.buttonText}>{messages.listenNow}</div>}
          onClick={handleClick}
        />
      </div>
    </div>
  )
}
