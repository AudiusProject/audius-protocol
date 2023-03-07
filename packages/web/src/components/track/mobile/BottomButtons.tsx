import { memo } from 'react'

import { FeatureFlags, PremiumTrackStatus } from '@audius/common'
import { IconLock } from '@audius/stems'

import FavoriteButton from 'components/alt-button/FavoriteButton'
import MoreButton from 'components/alt-button/MoreButton'
import RepostButton from 'components/alt-button/RepostButton'
import ShareButton from 'components/alt-button/ShareButton'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useFlag } from 'hooks/useRemoteConfig'

import styles from './BottomButtons.module.css'

type BottomButtonsProps = {
  hasSaved: boolean
  hasReposted: boolean
  toggleSave: () => void
  toggleRepost: () => void
  onClickOverflow: () => void
  onShare: () => void
  isOwner: boolean
  isDarkMode: boolean
  isUnlisted?: boolean
  isShareHidden?: boolean
  isTrack?: boolean
  doesUserHaveAccess?: boolean
  premiumTrackStatus?: PremiumTrackStatus
  isMatrixMode: boolean
}

const messages = {
  locked: 'LOCKED',
  unlocking: 'UNLOCKING'
}

const BottomButtons = (props: BottomButtonsProps) => {
  const { isEnabled: isGatedContentEnabled } = useFlag(
    FeatureFlags.GATED_CONTENT_ENABLED
  )

  const repostButton = () => {
    return (
      <RepostButton
        onClick={() => props.toggleRepost()}
        isActive={props.hasReposted}
        isDisabled={props.isOwner}
        isUnlisted={props.isUnlisted}
        isDarkMode={props.isDarkMode}
        isMatrixMode={props.isMatrixMode}
      />
    )
  }

  const favoriteButton = () => {
    return (
      <FavoriteButton
        onClick={() => props.toggleSave()}
        isActive={props.hasSaved}
        isDisabled={props.isOwner}
        isUnlisted={props.isUnlisted}
        isDarkMode={props.isDarkMode}
        isMatrixMode={props.isMatrixMode}
      />
    )
  }

  const shareButton = () => {
    return (
      <ShareButton
        onClick={props.onShare}
        isDarkMode={props.isDarkMode}
        isMatrixMode={props.isMatrixMode}
        isShareHidden={props.isShareHidden}
      />
    )
  }

  const premiumStatus = () => {
    return props.premiumTrackStatus === 'UNLOCKING' ? (
      <div className={styles.premiumContent}>
        <LoadingSpinner className={styles.spinner} />
        {messages.unlocking}
      </div>
    ) : (
      <div className={styles.premiumContent}>
        <IconLock />
        {messages.locked}
      </div>
    )
  }

  const moreButton = () => {
    return (
      <MoreButton
        onClick={props.onClickOverflow}
        isDarkMode={props.isDarkMode}
        isMatrixMode={props.isMatrixMode}
      />
    )
  }

  if (isGatedContentEnabled && props.isTrack && !props.doesUserHaveAccess) {
    return (
      <div className={styles.bottomButtons}>
        {premiumStatus()}
        {moreButton()}
      </div>
    )
  }

  if (props.isUnlisted) {
    return (
      <div className={styles.bottomButtons}>
        {shareButton()}
        {moreButton()}
      </div>
    )
  }

  return (
    <div className={styles.bottomButtons}>
      {repostButton()}
      {favoriteButton()}
      {shareButton()}
      {moreButton()}
    </div>
  )
}

export default memo(BottomButtons)
