import { memo, MouseEvent } from 'react'

import { IconShare, IconKebabHorizontal } from '@audius/harmony'
import { IconButton } from '@audius/stems'

import FavoriteButton from 'components/alt-button/FavoriteButton'
import RepostButton from 'components/alt-button/RepostButton'

import styles from './ActionsBar.module.css'

type ActionsBarProps = {
  hasReposted: boolean
  hasFavorited: boolean
  isCollectible: boolean
  isOwner: boolean
  onToggleRepost: () => void
  onToggleFavorite: () => void
  onShare: () => void
  onClickOverflow: () => void
  isDarkMode: boolean
  isMatrixMode: boolean
  showRepost?: boolean
  showFavorite?: boolean
}

const ActionsBar = ({
  hasReposted,
  hasFavorited,
  isCollectible = false,
  isOwner,
  onToggleRepost,
  onToggleFavorite,
  onShare,
  onClickOverflow,
  isDarkMode,
  isMatrixMode,
  showRepost = true,
  showFavorite = true
}: ActionsBarProps) => {
  return (
    <div className={styles.actionsBar}>
      {showRepost ? (
        <RepostButton
          isDarkMode={isDarkMode}
          isMatrixMode={isMatrixMode}
          isActive={hasReposted}
          isDisabled={isOwner || isCollectible}
          onClick={onToggleRepost}
          wrapperClassName={styles.icon}
          className={styles.repostButton}
          altVariant
        />
      ) : null}
      {showFavorite ? (
        <FavoriteButton
          isActive={hasFavorited}
          isDisabled={isOwner || isCollectible}
          isDarkMode={isDarkMode}
          isMatrixMode={isMatrixMode}
          onClick={onToggleFavorite}
          wrapperClassName={styles.icon}
          className={styles.favoriteButton}
          altVariant
        />
      ) : null}
      <IconButton
        aria-label='share'
        disabled={isCollectible}
        icon={<IconShare />}
        onClick={onShare}
        className={styles.icon}
      />
      <IconButton
        aria-label='more actions'
        icon={<IconKebabHorizontal />}
        className={styles.icon}
        onClick={(event: MouseEvent) => {
          event.stopPropagation()
          onClickOverflow()
        }}
      />
    </div>
  )
}

export default memo(ActionsBar)
