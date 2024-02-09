import { IconShare, IconKebabHorizontal } from '@audius/harmony'
import { IconButton } from '@audius/stems'
import cn from 'classnames'
import Lottie from 'react-lottie'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import AnimatedIconButton, {
  AnimatedIconType
} from 'components/animated-button/AnimatedIconButton'
import { ClientOnly } from 'components/client-only/ClientOnly'

import styles from './ActionButtonRow.module.css'

type ActionButtonRowProps = {
  isOwner: boolean
  isReposted: boolean
  isSaved: boolean
  isPublished?: boolean
  isPublishing?: boolean
  showRepost: boolean
  onRepost?: () => void
  onFavorite?: () => void
  onShare?: () => void
  onClickOverflow?: () => void
  showFavorite: boolean
  showShare: boolean
  showOverflow: boolean
  shareToastDisabled?: boolean
  darkMode: boolean
}

// A row of action buttons, visible on track or playlist pages.
const ActionButtonRow = ({
  showRepost,
  isOwner,
  isSaved,
  isReposted,
  isPublished = true,
  isPublishing = false,
  showFavorite,
  showShare,
  showOverflow,
  shareToastDisabled = true,
  onRepost = () => {},
  onFavorite = () => {},
  onShare = () => {},
  onClickOverflow = () => {},
  darkMode
}: ActionButtonRowProps) => {
  const renderRepostButton = () => {
    return (
      <div className={styles.animatedIconWrapper}>
        <AnimatedIconButton
          icon={AnimatedIconType.REPOST_LIGHT}
          className={cn(styles.animatedActionButton)}
          isDisabled={isOwner}
          onClick={onRepost}
          isActive={isReposted}
          activeClassName={styles.activeButton}
          disabledClassName={styles.disabledButton}
          darkMode={darkMode}
        />
      </div>
    )
  }

  const renderFavoriteButton = () => {
    return (
      <div className={styles.animatedIconWrapper}>
        <AnimatedIconButton
          className={cn(styles.animatedActionButton, styles.favoriteButton)}
          activeClassName={styles.activeButton}
          disabledClassName={styles.disabledButton}
          isActive={isSaved}
          isDisabled={isOwner}
          icon={AnimatedIconType.FAVORITE_LIGHT}
          onClick={onFavorite}
          darkMode={darkMode}
        />
      </div>
    )
  }

  const renderShareButton = () => {
    return (
      <IconButton
        aria-label='share'
        className={cn(styles.actionButton, styles.shareButton, {
          [styles.disabledButton]: !isPublished
        })}
        icon={<IconShare />}
        onClick={isPublished ? onShare : () => {}}
      />
    )
  }

  const renderSpinner = () => {
    return (
      <div className={cn(styles.actionButton, styles.spinner)}>
        <Lottie
          options={{
            loop: true,
            autoplay: true,
            animationData: loadingSpinner
          }}
        />
      </div>
    )
  }

  const renderOverflowMenu = () => {
    return (
      <IconButton
        aria-label='more actions'
        className={cn(styles.actionButton)}
        icon={<IconKebabHorizontal />}
        onClick={onClickOverflow}
      />
    )
  }

  return (
    <div className={styles.buttonsRow}>
      <ClientOnly>
        {showRepost && renderRepostButton()}
        {showFavorite && renderFavoriteButton()}
        {showShare && (isPublishing ? renderSpinner() : renderShareButton())}
        {showOverflow && renderOverflowMenu()}
      </ClientOnly>
    </div>
  )
}

export default ActionButtonRow
