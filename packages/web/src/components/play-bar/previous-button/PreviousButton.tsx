import cn from 'classnames'

import IconPrev from 'assets/img/pbIconPrev.svg'

import styles from '../PlayBarButton.module.css'

export type PreviousButtonProps = {
  onClick: () => void
  isMobile: boolean
}

const PreviousButton = ({ onClick, isMobile }: PreviousButtonProps) => {
  return (
    <button
      className={cn(styles.button, {
        [styles.buttonFixedSize]: isMobile,
        [styles.previousNext]: isMobile
      })}
      onClick={onClick}
    >
      <IconPrev className={styles.noAnimation} />
    </button>
  )
}

export default PreviousButton
