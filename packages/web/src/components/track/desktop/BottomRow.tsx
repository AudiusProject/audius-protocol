import { ReactNode, useCallback } from 'react'

import { FeatureFlags, FieldVisibility } from '@audius/common'
import { IconLock } from '@audius/stems'
import cn from 'classnames'

import FavoriteButton from 'components/alt-button/FavoriteButton'
import RepostButton from 'components/alt-button/RepostButton'
import ShareButton from 'components/alt-button/ShareButton'
import Tooltip from 'components/tooltip/Tooltip'
import { useFlag } from 'hooks/useRemoteConfig'

import styles from './TrackTile.module.css'

const messages = {
  repostLabel: 'Repost',
  unrepostLabel: 'Unrepost',
  locked: 'LOCKED'
}

type BottomRowProps = {
  doesUserHaveAccess?: boolean
  isDisabled?: boolean
  isLoading?: boolean
  isFavorited?: boolean
  isReposted?: boolean
  rightActions?: ReactNode
  bottomBar?: ReactNode
  isUnlisted?: boolean
  fieldVisibility?: FieldVisibility
  isOwner: boolean
  isDarkMode?: boolean
  isMatrixMode: boolean
  showIconButtons?: boolean
  isTrack?: boolean
  onClickRepost: (e?: any) => void
  onClickFavorite: (e?: any) => void
  onClickShare: (e?: any) => void
}

export const BottomRow = ({
  doesUserHaveAccess,
  isDisabled,
  isLoading,
  isFavorited,
  isReposted,
  rightActions,
  bottomBar,
  isUnlisted,
  fieldVisibility,
  isOwner,
  isDarkMode,
  isMatrixMode,
  showIconButtons,
  isTrack,
  onClickRepost,
  onClickFavorite,
  onClickShare
}: BottomRowProps) => {
  const { isEnabled: isPremiumContentEnabled } = useFlag(
    FeatureFlags.PREMIUM_CONTENT_ENABLED
  )

  const repostLabel = isReposted ? messages.unrepostLabel : messages.repostLabel

  const hideShare: boolean = fieldVisibility
    ? fieldVisibility.share === false
    : false

  const onStopPropagation = useCallback((e: any) => e.stopPropagation(), [])

  const renderShareButton = () => {
    return (
      <Tooltip
        text={'Share'}
        disabled={isDisabled || hideShare}
        placement='top'
        mount='page'
      >
        <div
          className={cn(styles.iconButtonContainer, {
            [styles.isHidden]: hideShare
          })}
          onClick={onStopPropagation}
        >
          <ShareButton
            onClick={onClickShare}
            isDarkMode={!!isDarkMode}
            className={styles.iconButton}
            stopPropagation={false}
            isMatrixMode={isMatrixMode}
          />
        </div>
      </Tooltip>
    )
  }

  if (isPremiumContentEnabled && isTrack && !doesUserHaveAccess) {
    return (
      <div className={cn(styles.premiumContent, styles.bottomRow)}>
        <IconLock />
        {messages.locked}
      </div>
    )
  }

  return (
    <div className={styles.bottomRow}>
      {bottomBar}
      {!isLoading && showIconButtons && isUnlisted && (
        <div className={styles.iconButtons}>{renderShareButton()}</div>
      )}
      {!isLoading && showIconButtons && !isUnlisted && (
        <div className={styles.iconButtons}>
          <Tooltip
            text={repostLabel}
            disabled={isDisabled || isOwner}
            placement='top'
            mount='page'
          >
            <div
              className={cn(styles.iconButtonContainer, {
                [styles.isDisabled]: isOwner,
                [styles.isHidden]: isUnlisted
              })}
            >
              <RepostButton
                aria-label={repostLabel}
                onClick={onClickRepost}
                isActive={isReposted}
                isDisabled={isOwner}
                isDarkMode={!!isDarkMode}
                isMatrixMode={isMatrixMode}
                wrapperClassName={styles.iconButton}
              />
            </div>
          </Tooltip>
          <Tooltip
            text={isFavorited ? 'Unfavorite' : 'Favorite'}
            disabled={isDisabled || isOwner}
            placement='top'
            mount='page'
          >
            <div
              className={cn(styles.iconButtonContainer, {
                [styles.isDisabled]: isOwner,
                [styles.isHidden]: isUnlisted
              })}
            >
              <FavoriteButton
                onClick={onClickFavorite}
                isActive={isFavorited}
                isDisabled={isOwner}
                isDarkMode={!!isDarkMode}
                isMatrixMode={isMatrixMode}
                wrapperClassName={styles.iconButton}
              />
            </div>
          </Tooltip>
          {renderShareButton()}
        </div>
      )}
      {!isLoading && <div>{rightActions}</div>}
    </div>
  )
}
