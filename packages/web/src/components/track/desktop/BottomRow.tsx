import { MouseEvent, ReactNode, useCallback } from 'react'

import {
  FieldVisibility,
  premiumContentSelectors,
  ID,
  PremiumConditions,
  Nullable
} from '@audius/common'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import FavoriteButton from 'components/alt-button/FavoriteButton'
import RepostButton from 'components/alt-button/RepostButton'
import ShareButton from 'components/alt-button/ShareButton'
import Tooltip from 'components/tooltip/Tooltip'
import typeStyles from 'components/typography/typography.module.css'

import { PremiumConditionsPill } from '../PremiumConditionsPill'

import styles from './TrackTile.module.css'

const { getPremiumTrackStatusMap } = premiumContentSelectors

const messages = {
  repostLabel: 'Repost',
  unrepostLabel: 'Unrepost'
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
  trackId?: ID
  premiumConditions?: Nullable<PremiumConditions>
  onClickRepost: (e?: any) => void
  onClickFavorite: (e?: any) => void
  onClickShare: (e?: any) => void
  onClickPremiumPill?: (e: MouseEvent) => void
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
  trackId,
  premiumConditions,
  onClickRepost,
  onClickFavorite,
  onClickShare,
  onClickPremiumPill
}: BottomRowProps) => {
  const premiumTrackStatusMap = useSelector(getPremiumTrackStatusMap)
  const premiumTrackStatus = trackId && premiumTrackStatusMap[trackId]

  const repostLabel = isReposted ? messages.unrepostLabel : messages.repostLabel

  const hideShare: boolean = isOwner
    ? false
    : fieldVisibility
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

  if (isTrack && premiumConditions && !isLoading && !doesUserHaveAccess) {
    return (
      <div
        className={cn(
          typeStyles.title,
          typeStyles.titleSmall,
          styles.bottomRow
        )}
      >
        <PremiumConditionsPill
          premiumConditions={premiumConditions}
          unlocking={premiumTrackStatus === 'UNLOCKING'}
          onClick={onClickPremiumPill}
        />
        <div>{rightActions}</div>
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
      {!isLoading ? <div>{rightActions}</div> : null}
    </div>
  )
}
