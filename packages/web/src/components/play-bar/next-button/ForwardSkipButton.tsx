import cn from 'classnames'

import IconPodcastForward from 'assets/img/iconPodcastForward.svg'

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
