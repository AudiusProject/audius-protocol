import { useCallback } from 'react'

import {
  IconArrowRight as IconArrow,
  IconRobot,
  PlainButton,
  Box
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { push } from 'utils/navigation'
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
    dispatch(push(profilePageAiAttributedTracks(handle)))
  }, [dispatch, handle])

  return (
    <div className={styles.root} onClick={handleClick}>
      <div className={styles.title}>
        <IconRobot className={styles.iconRobot} />
        {messages.title}
      </div>
      <div className={styles.body}>
        <div className={styles.description}>{messages.description}</div>
        <Box pl='xs' mt='m'>
          <PlainButton
            variant='subdued'
            iconRight={IconArrow}
            onClick={handleClick}
          >
            {messages.listenNow}
          </PlainButton>
        </Box>
      </div>
    </div>
  )
}
