import cn from 'classnames'

import Caret from 'assets/img/iconCaretDown.svg'

import styles from './HeaderButton.module.css'

type HeaderButtonProps = {
  showIcon: boolean
  onClick: () => void
  text: string
  className?: string
}

// A button that lives in the mobile header.
const HeaderButton = ({
  showIcon,
  onClick,
  text,
  className
}: HeaderButtonProps) => {
  return (
    <div
      className={cn(
        styles.container,
        { [styles.showIcon]: showIcon },
        className
      )}
      onClick={onClick}
    >
      {showIcon && (
        <div className={styles.icon}>
          <Caret />
          <Caret />
        </div>
      )}
      <div className={styles.text}>{text}</div>
    </div>
  )
}

export default HeaderButton
