import { IconPodcastBack } from '@audius/harmony'
import cn from 'classnames'

import styles from '../PlayBarButton.module.css'

export type BackwardSkipButtonProps = {
  onClick: () => void
  isMobile: boolean
}

const BackwardSkipButton = ({ onClick, isMobile }: BackwardSkipButtonProps) => {
  return (
    <button
      className={cn(styles.button, {
        [styles.buttonFixedSize]: isMobile,
        [styles.previousNext]: isMobile
      })}
      onClick={onClick}
      aria-label='Skip backward 15 seconds'
    >
      <IconPodcastBack color='default' className={styles.noAnimation} />
    </button>
  )
}

export default BackwardSkipButton
