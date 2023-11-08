import cn from 'classnames'

import IconNext from 'assets/img/pbIconNext.svg'

import styles from '../PlayBarButton.module.css'

export type NextButtonProps = {
  onClick: () => void
  isMobile: boolean
}

const NextButton = ({ onClick, isMobile }: NextButtonProps) => {
  return (
    <button
      className={cn(styles.button, {
        [styles.buttonFixedSize]: isMobile,
        [styles.previousNext]: isMobile
      })}
      onClick={onClick}
    >
      <IconNext className={styles.noAnimation} />
    </button>
  )
}

export default NextButton
