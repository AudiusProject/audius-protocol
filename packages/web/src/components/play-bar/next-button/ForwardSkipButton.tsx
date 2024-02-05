import { IconPodcastForward } from '@audius/harmony'
import cn from 'classnames'

import styles from '../PlayBarButton.module.css'

export type ForwardSkipButtonProps = {
  onClick: () => void
  isMobile: boolean
}

const ForwardSkipButton = ({ onClick, isMobile }: ForwardSkipButtonProps) => {
  return (
    <button
      className={cn(styles.button, {
        [styles.buttonFixedSize]: isMobile,
        [styles.previousNext]: isMobile
      })}
      onClick={onClick}
    >
      <IconPodcastForward className={styles.noAnimation} />
    </button>
  )
}

export default ForwardSkipButton
