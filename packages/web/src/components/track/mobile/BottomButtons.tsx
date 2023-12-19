import { MouseEvent, memo } from 'react'

import {
  Nullable,
  StreamConditions,
  GatedTrackStatus,
  isContentUSDCPurchaseGated
} from '@audius/common'
import cn from 'classnames'

import FavoriteButton from 'components/alt-button/FavoriteButton'
import MoreButton from 'components/alt-button/MoreButton'
import RepostButton from 'components/alt-button/RepostButton'
import ShareButton from 'components/alt-button/ShareButton'
import typeStyles from 'components/typography/typography.module.css'
import { useIsUSDCEnabled } from 'hooks/useIsUSDCEnabled'

import { GatedConditionsPill } from '../GatedConditionsPill'

import styles from './BottomButtons.module.css'

type BottomButtonsProps = {
  hasSaved: boolean
  hasReposted: boolean
  toggleSave: () => void
  toggleRepost: () => void
  onClickOverflow: () => void
  onShare: () => void
  onClickPill?: (e: MouseEvent) => void
  isLoading: boolean
  isOwner: boolean
  isDarkMode: boolean
  isUnlisted?: boolean
  isShareHidden?: boolean
  isTrack?: boolean
  hasStreamAccess?: boolean
  readonly?: boolean
  streamConditions?: Nullable<StreamConditions>
  gatedTrackStatus?: GatedTrackStatus
  isMatrixMode: boolean
}

const BottomButtons = (props: BottomButtonsProps) => {
  const isUSDCEnabled = useIsUSDCEnabled()
  const isUSDCPurchase =
    isUSDCEnabled && isContentUSDCPurchaseGated(props.streamConditions)

  // Readonly variant only renders content for locked USDC tracks
  if (!!props.readonly && (!isUSDCPurchase || props.hasStreamAccess)) {
    return null
  }

  const moreButton = (
    <MoreButton
      wrapperClassName={styles.button}
      className={styles.buttonContent}
      onClick={props.onClickOverflow}
      isDarkMode={props.isDarkMode}
      isMatrixMode={props.isMatrixMode}
    />
  )

  // Stream conditions without access
  if (
    props.isTrack &&
    !props.isLoading &&
    props.streamConditions &&
    !props.hasStreamAccess
  ) {
    return (
      <div
        className={cn(
          typeStyles.title,
          typeStyles.titleSmall,
          styles.bottomButtons
        )}
      >
        <div className={styles.gatedContentContainer}>
          <GatedConditionsPill
            streamConditions={props.streamConditions}
            unlocking={props.gatedTrackStatus === 'UNLOCKING'}
            onClick={props.onClickPill}
          />
        </div>
        {props.readonly ? null : moreButton}
      </div>
    )
  }

  const shareButton = (
    <ShareButton
      wrapperClassName={styles.button}
      className={styles.buttonContent}
      onClick={props.onShare}
      isDarkMode={props.isDarkMode}
      isMatrixMode={props.isMatrixMode}
      isShareHidden={props.isShareHidden}
    />
  )

  if (props.isUnlisted) {
    return (
      <div className={styles.bottomButtons}>
        <div className={styles.actions}>{shareButton}</div>
        {moreButton}
      </div>
    )
  }

  return (
    <div className={styles.bottomButtons}>
      <div className={styles.actions}>
        <RepostButton
          wrapperClassName={styles.button}
          className={styles.buttonContent}
          onClick={props.toggleRepost}
          isActive={props.hasReposted}
          isDisabled={props.isOwner}
          isUnlisted={props.isUnlisted}
          isDarkMode={props.isDarkMode}
          isMatrixMode={props.isMatrixMode}
        />
        <FavoriteButton
          wrapperClassName={styles.button}
          className={styles.buttonContent}
          onClick={props.toggleSave}
          isActive={props.hasSaved}
          isDisabled={props.isOwner}
          isUnlisted={props.isUnlisted}
          isDarkMode={props.isDarkMode}
          isMatrixMode={props.isMatrixMode}
        />
        {shareButton}
      </div>
      {moreButton}
    </div>
  )
}

export default memo(BottomButtons)
