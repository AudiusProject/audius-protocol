import { memo } from 'react'

import { Nullable, PremiumConditions, PremiumTrackStatus } from '@audius/common'
import cn from 'classnames'

import FavoriteButton from 'components/alt-button/FavoriteButton'
import MoreButton from 'components/alt-button/MoreButton'
import RepostButton from 'components/alt-button/RepostButton'
import ShareButton from 'components/alt-button/ShareButton'
import typeStyles from 'components/typography/typography.module.css'

import { PremiumConditionsPill } from '../PremiumConditionsPill'

import styles from './BottomButtons.module.css'

type BottomButtonsProps = {
  hasSaved: boolean
  hasReposted: boolean
  toggleSave: () => void
  toggleRepost: () => void
  onClickOverflow: () => void
  onShare: () => void
  isLoading: boolean
  isOwner: boolean
  isDarkMode: boolean
  isUnlisted?: boolean
  isShareHidden?: boolean
  isTrack?: boolean
  doesUserHaveAccess?: boolean
  premiumConditions?: Nullable<PremiumConditions>
  premiumTrackStatus?: PremiumTrackStatus
  isMatrixMode: boolean
}

const BottomButtons = (props: BottomButtonsProps) => {
  const moreButton = (
    <MoreButton
      wrapperClassName={styles.button}
      className={styles.buttonContent}
      onClick={props.onClickOverflow}
      isDarkMode={props.isDarkMode}
      isMatrixMode={props.isMatrixMode}
    />
  )

  // Premium condition without access
  if (
    props.isTrack &&
    !props.isLoading &&
    props.premiumConditions &&
    !props.doesUserHaveAccess
  ) {
    return (
      <div
        className={cn(
          typeStyles.title,
          typeStyles.titleSmall,
          styles.bottomButtons
        )}
      >
        <div className={styles.premiumContentContainer}>
          <PremiumConditionsPill
            premiumConditions={props.premiumConditions}
            unlocking={props.premiumTrackStatus === 'UNLOCKING'}
          />
        </div>
        {moreButton}
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
