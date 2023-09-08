import cn from 'classnames'

import FavoriteButton from 'components/alt-button/FavoriteButton'
import { isDarkMode, isMatrix } from 'utils/theme/theme'

import styles from './TableFavoriteButton.module.css'

type TableFavoriteButtonProps = {
  className?: string
  favorited?: boolean
  onClick?: (e: any) => void
}

export const TableFavoriteButton = ({
  className,
  favorited,
  onClick
}: TableFavoriteButtonProps) => {
  const isMatrixMode = isMatrix()
  const isDark = isDarkMode()

  return (
    <div
      onClick={onClick}
      className={cn(styles.tableFavoriteButton, className, {
        [styles.notFavorited]: !favorited
      })}
    >
      <FavoriteButton
        isActive={favorited}
        className={styles.icon}
        onClick={onClick}
        isDarkMode={isDark}
        isMatrixMode={isMatrixMode}
      />
    </div>
  )
}
