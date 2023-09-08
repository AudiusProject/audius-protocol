import RobotFace from 'assets/img/robotFace.png'
import { AUDIUS_AI_BLOG_LINK } from 'utils/route'

import styles from './ShareAiTracksTile.module.css'

const messages = {
  title: 'Share Your AI-Generated Tracks',
  description:
    "Join in by uploading your own AI-made tracks! Just mark them as AI-Generated during the upload process and tag the artist you'd like to credit.",
  learnMore: 'Learn More'
}

export const ShareAiTracksTile = () => {
  return (
    <div className={styles.tile}>
      <div className={styles.content}>
        <div className={styles.title}>
          <img className={styles.robotImage} src={RobotFace} alt='ai' />
          <span className={styles.titleTextRoot}>
            <span className={styles.titleText}>{messages.title}</span>
            <span className={styles.description}>{messages.description}</span>
          </span>
        </div>
        <a
          target='_blank'
          href={AUDIUS_AI_BLOG_LINK}
          className={styles.learnMore}
          rel='noreferrer'
        >
          {messages.learnMore}
        </a>
      </div>
    </div>
  )
}
