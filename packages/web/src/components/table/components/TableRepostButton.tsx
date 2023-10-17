import cn from 'classnames'

import RepostButton from 'components/alt-button/RepostButton'
import Toast from 'components/toast/Toast'
import { isDarkMode, isMatrix } from 'utils/theme/theme'

import styles from './TableRepostButton.module.css'

const REPOST_TIMEOUT = 1000

type TableRepostButtonProps = {
  className?: string
  onClick?: (e: any) => void
  reposted?: boolean
}

export const TableRepostButton = ({
  className,
  onClick,
  reposted
}: TableRepostButtonProps) => {
  const isMatrixMode = isMatrix()
  const isDark = isDarkMode()

  return (
    <div onClick={onClick} className={cn(styles.tableRepostButton, className)}>
      <Toast
        text={'Reposted!'}
        disabled={reposted}
        delay={REPOST_TIMEOUT}
        containerClassName={styles.iconContainer}
      >
        <RepostButton
          className={styles.icon}
          isActive={reposted}
          onClick={onClick}
          isDarkMode={isDark}
          isMatrixMode={isMatrixMode}
        />
      </Toast>
    </div>
  )
}
