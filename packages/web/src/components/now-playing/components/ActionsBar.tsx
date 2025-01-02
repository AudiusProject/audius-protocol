import { memo, MouseEvent } from 'react'

import { useCurrentUserId, useTrack } from '@audius/common/api'
import { useGatedContentAccess } from '@audius/common/hooks'
import { ID } from '@audius/common/models'
import {
  IconShare,
  IconKebabHorizontal,
  IconButton,
  Flex
} from '@audius/harmony'

import FavoriteButton from 'components/alt-button/FavoriteButton'
import RepostButton from 'components/alt-button/RepostButton'

import styles from './ActionsBar.module.css'

type ActionsBarProps = {
  trackId: ID
  isCollectible: boolean
  onToggleRepost: () => void
  onToggleFavorite: () => void
  onShare: () => void
  onClickOverflow: () => void
  isDarkMode: boolean
  isMatrixMode: boolean
}

const ActionsBar = ({
  trackId,
  isCollectible = false,
  onToggleRepost,
  onToggleFavorite,
  onShare,
  onClickOverflow,
  isDarkMode,
  isMatrixMode
}: ActionsBarProps) => {
  const { data: track } = useTrack(trackId)
  const { data: currentUserId } = useCurrentUserId()
  const {
    is_unlisted: isUnlisted,
    owner_id: ownerId,
    has_current_user_reposted: hasReposted,
    has_current_user_saved: hasSaved
  } = track ?? {}
  const isOwner = ownerId === currentUserId
  const { hasStreamAccess } = useGatedContentAccess(track ?? {})
  const shouldShowActions = hasStreamAccess && !isUnlisted

  if (!shouldShowActions) return null

  return (
    <Flex className={styles.actionsBar}>
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
      <FavoriteButton
        isActive={hasSaved}
        isDisabled={isOwner || isCollectible}
        isDarkMode={isDarkMode}
        isMatrixMode={isMatrixMode}
        onClick={onToggleFavorite}
        wrapperClassName={styles.icon}
        className={styles.favoriteButton}
        altVariant
      />
      <IconButton
        aria-label='share'
        size='xl'
        color='default'
        disabled={isCollectible}
        icon={IconShare}
        onClick={onShare}
      />
      <IconButton
        aria-label='more actions'
        size='xl'
        color='default'
        icon={IconKebabHorizontal}
        onClick={(event: MouseEvent) => {
          event.stopPropagation()
          onClickOverflow()
        }}
      />
    </Flex>
  )
}

export default memo(ActionsBar)
