import {
  MouseEvent,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
  MouseEventHandler
} from 'react'

import {
  ID,
  ProfilePictureSizes,
  SquareSizes,
  CoverArtSizes,
  pluralize,
  imageBlank as placeholderArt,
  DogEarType
} from '@audius/common'
import { IconKebabHorizontal } from '@audius/harmony'
import cn from 'classnames'

import ActionsTab from 'components/actions-tab/ActionsTab'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import Menu, { MenuOptionType } from 'components/menu/Menu'
import RepostFavoritesStats, {
  Size
} from 'components/repost-favorites-stats/RepostFavoritesStats'
import { Tile } from 'components/tile'
import UserBadges from 'components/user-badges/UserBadges'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { isDescendantElementOf } from 'utils/domUtils'

import styles from './Card.module.css'

const ARTWORK_LOAD_TIMEOUT_MS = 500

const cardSizeStyles = {
  small: {
    root: styles.smallContainer,
    coverArt: styles.smallCoverArt,
    textContainer: cn(styles.textContainer, styles.smallTextContainer),
    actionsContainer: styles.smallActionsContainer
  },
  medium: {
    root: styles.mediumContainer,
    coverArt: styles.mediumCoverArt,
    textContainer: cn(styles.textContainer, styles.mediumTextContainer),
    actionsContainer: styles.mediumActionsTabContainer
  },
  large: {
    root: styles.largeContainer,
    coverArt: styles.largeCoverArt,
    textContainer: cn(styles.textContainer, styles.largeTextContainer),
    actionsContainer: styles.largeActionsTabContainer
  }
}

export type CardProps = {
  className?: string
  id: ID
  userId?: ID
  imageSize: ProfilePictureSizes | CoverArtSizes | null
  primaryText: ReactNode
  secondaryText: ReactNode
  cardCoverImageSizes?: CoverArtSizes
  playlistName?: string
  isUser: boolean
  isPlaylist: boolean // playlist or album
  isPublic?: boolean // only for playlist or album
  handle: string
  playlistId?: number
  isReposted?: boolean
  isSaved?: boolean
  index?: number
  isLoading?: boolean
  setDidLoad?: (index: number) => void
  size: 'small' | 'medium' | 'large'
  menu?: MenuOptionType
  // For wrapping draggable
  href?: string
  // Socials
  reposts?: number
  favorites?: number
  onClickReposts?: () => void
  onClickFavorites?: () => void
  trackCount?: number
  onClick: (e: MouseEvent) => void
}

const UserImage = (props: {
  id: ID
  imageSize: ProfilePictureSizes
  isLoading?: boolean
  callback?: () => void
}) => {
  const { callback } = props
  const image = useUserProfilePicture(
    props.id,
    props.imageSize,
    SquareSizes.SIZE_480_BY_480
  )
  useEffect(() => {
    if (image && callback) callback()
  }, [image, callback])

  return (
    <DynamicImage
      className={cn(styles.coverArt, styles.userImage)}
      image={props.isLoading ? '' : image}
    />
  )
}

const CollectionImage = (props: {
  id: ID
  imageSize: CoverArtSizes
  isLoading?: boolean
  callback?: () => void
}) => {
  const { callback } = props
  const image = useCollectionCoverArt(
    props.id,
    props.imageSize,
    SquareSizes.SIZE_480_BY_480,
    placeholderArt
  )

  useEffect(() => {
    if (image && callback) callback()
  }, [image, callback])

  return (
    <DynamicImage
      className={styles.coverArt}
      image={props.isLoading ? '' : image}
    />
  )
}

const Card = ({
  className,
  isUser,
  isLoading,
  index,
  setDidLoad,
  id,
  userId,
  imageSize = null,
  isPlaylist,
  handle,
  isReposted,
  isSaved,
  playlistId,
  isPublic = true,
  playlistName,
  primaryText,
  secondaryText,
  size,
  menu,
  reposts,
  favorites,
  trackCount,
  onClickReposts,
  onClickFavorites,
  onClick,
  href
}: CardProps) => {
  // The card is considered `setDidLoad` (and calls it) if the artwork has loaded and its
  // parent is no longer telling it that it is loading. This allows ordered loading.
  const [artworkLoaded, setArtworkLoaded] = useState(false)

  const menuActionsRef = useRef<HTMLDivElement>(null)
  const handleClick: MouseEventHandler<HTMLAnchorElement> = useCallback(
    (e) => {
      e.preventDefault()
      if (isDescendantElementOf(e?.target, menuActionsRef.current)) return
      onClick(e)
    },
    [menuActionsRef, onClick]
  )

  useEffect(() => {
    if (artworkLoaded && setDidLoad) {
      setTimeout(() => setDidLoad(index!))
    }
  }, [artworkLoaded, setDidLoad, index])

  useEffect(() => {
    // Force a transition if we take too long to signal
    if (!artworkLoaded) {
      const timerId = setTimeout(
        () => setArtworkLoaded(true),
        ARTWORK_LOAD_TIMEOUT_MS
      )
      return () => clearTimeout(timerId)
    }
  }, [artworkLoaded, setArtworkLoaded])

  const artworkCallback = useCallback(() => {
    setArtworkLoaded(true)
  }, [setArtworkLoaded])

  const sizeStyles = cardSizeStyles[size]

  let bottomActions = null
  if (menu && (size === 'large' || size === 'medium')) {
    bottomActions = (
      <div className={sizeStyles.actionsContainer} ref={menuActionsRef}>
        <ActionsTab
          handle={handle}
          standalone
          direction='horizontal'
          variant={isPlaylist ? 'playlist' : 'album'}
          playlistId={playlistId}
          playlistName={playlistName}
          permalink={href}
          containerStyles={styles.actionContainer}
          currentUserReposted={isReposted}
          currentUserSaved={isSaved}
          isPublic={isPublic}
          includeEdit
        />
      </div>
    )
  } else if (menu && size === 'small') {
    bottomActions = (
      <div className={sizeStyles.actionsContainer} ref={menuActionsRef}>
        <Menu menu={menu}>
          {(ref, triggerPopup: () => void) => (
            <div className={styles.iconContainer} onClick={triggerPopup}>
              <div ref={ref}>
                <IconKebabHorizontal className={styles.iconKebabHorizontal} />
              </div>
            </div>
          )}
        </Menu>
      </div>
    )
  }

  const showRepostFavoriteStats =
    !isUser && reposts && favorites && onClickReposts && onClickFavorites
  return (
    <Tile
      className={cn(className, styles.root, sizeStyles.root)}
      href={href}
      as='a'
      onClick={handleClick}
      dogEar={!isPublic ? DogEarType.HIDDEN : undefined}
    >
      <div
        className={cn(styles.coverArt, sizeStyles.coverArt, {
          [styles.userCardImage]: isUser
        })}
      >
        {isUser ? (
          <UserImage
            isLoading={isLoading}
            callback={artworkCallback}
            id={id}
            imageSize={imageSize as ProfilePictureSizes}
          />
        ) : (
          <CollectionImage
            isLoading={isLoading}
            callback={artworkCallback}
            id={id}
            imageSize={imageSize as CoverArtSizes}
          />
        )}
      </div>
      <div className={sizeStyles.textContainer}>
        <div className={styles.primaryText}>{primaryText}</div>
        <div className={styles.secondaryText}>
          <div className={styles.secondaryTextContent}>{secondaryText}</div>
          {userId ? (
            <UserBadges
              userId={userId}
              badgeSize={12}
              className={styles.iconVerified}
            />
          ) : null}
        </div>
        {showRepostFavoriteStats ? (
          <div className={styles.stats}>
            <RepostFavoritesStats
              isUnlisted={false}
              size={Size.SMALL}
              repostCount={reposts!}
              saveCount={favorites!}
              onClickReposts={onClickReposts!}
              onClickFavorites={onClickFavorites!}
              className={styles.statsWrapper}
            />
            {trackCount !== undefined && (
              <div className={styles.trackCount}>
                {`${trackCount} ${pluralize('Track', trackCount)}`}
              </div>
            )}
          </div>
        ) : null}
      </div>
      {bottomActions}
    </Tile>
  )
}

Card.defaultProps = {
  primaryText: '',
  secondaryText: '',
  isUser: false,
  isPlaylist: true,
  isReposted: false,
  isLoading: false,
  size: 'large',
  menu: {},
  onClick: () => {}
}

export default Card
