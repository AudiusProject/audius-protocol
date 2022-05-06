import React, {
  useCallback,
  memo,
  ReactChild,
  useRef,
  MutableRefObject,
  useState
} from 'react'

import { Popup, PopupPosition } from '@audius/stems'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { FollowSource } from 'common/models/Analytics'
import { ID } from 'common/models/Identifiers'
import { WidthSizes, SquareSizes } from 'common/models/ImageSizes'
import { getUserId } from 'common/store/account/selectors'
import { getUser } from 'common/store/cache/users/selectors'
import { setNotificationSubscription } from 'common/store/pages/profile/actions'
import * as socialActions from 'common/store/social/users/actions'
import { useUserCoverPhoto } from 'hooks/useUserCoverPhoto'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { AppState } from 'store/types'
import { profilePage } from 'utils/route'
import zIndex from 'utils/zIndex'

import ArtistCard from './ArtistCard'
import styles from './ArtistPopover.module.css'

type ArtistPopoverProps = {
  handle: string
  creator: any
  goToRoute: (route: string) => void
  onFollow: (userId: ID) => void
  onUnfollow: (userId: ID) => void
  children: ReactChild
  mouseEnterDelay: number
  component?: 'div' | 'span'
} & ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ArtistPopover = ({
  handle,
  onFollow,
  onUnfollow,
  children,
  creator,
  userId,
  goToRoute,
  mouseEnterDelay,
  component: Component = 'div'
}: ArtistPopoverProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const popupTimeout = useRef<NodeJS.Timeout | null>(null)
  const [popupVisible, setPopupVisible] = useState(false)

  const getCoverPhoto = useUserCoverPhoto(
    creator ? creator.user_id : null,
    creator ? creator._cover_photo_sizes : null,
    WidthSizes.SIZE_640,
    undefined,
    true
  )
  const getProfilePicture = useUserProfilePicture(
    creator ? creator.user_id : null,
    creator ? creator._profile_picture_sizes : null,
    SquareSizes.SIZE_150_BY_150,
    undefined,
    true
  )

  const onMouseEnter = useCallback(() => {
    getCoverPhoto()
    getProfilePicture()
    popupTimeout.current = setTimeout(() => {
      setPopupVisible(true)
    }, mouseEnterDelay * 1000)
  }, [getCoverPhoto, getProfilePicture, mouseEnterDelay])

  const onMouseLeave = () => {
    if (popupTimeout.current) clearTimeout(popupTimeout.current)
    setPopupVisible(false)
  }

  const onClickFollow = useCallback(() => {
    if (creator && creator.user_id) onFollow(creator.user_id)
  }, [creator, onFollow])

  const onClickUnfollow = useCallback(() => {
    if (creator && creator.user_id) onUnfollow(creator.user_id)
  }, [creator, onUnfollow])

  const onNameClick = useCallback(() => {
    goToRoute(profilePage(handle))
  }, [handle, goToRoute])

  const following = creator ? creator.does_current_user_follow : false
  const content =
    creator && userId !== creator.user_id ? (
      <ArtistCard
        description={creator.bio}
        trackCount={creator.track_count}
        playlistCount={creator.playlist_count}
        followerCount={creator.follower_count}
        followingCount={creator.followee_count}
        doesFollowCurrentUser={!!creator.does_follow_current_user}
        userId={creator.user_id}
        name={creator.name}
        handle={creator.handle}
        profilePictureSizes={creator._profile_picture_sizes}
        coverPhotoSizes={creator._cover_photo_sizes}
        isVerified={creator.is_verified}
        isArtist={creator.is_creator || creator.track_count > 0}
        onNameClick={onNameClick}
        following={following}
        onFollow={onClickFollow}
        onUnfollow={onClickUnfollow}
      />
    ) : null

  return (
    <Component
      className={cn(styles.popoverContainer, 'artistPopover')}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      ref={containerRef}
    >
      {children}
      <Popup
        isVisible={popupVisible}
        anchorRef={containerRef as MutableRefObject<HTMLDivElement>}
        onClose={() => {}}
        className={styles.popup}
        position={PopupPosition.TOP_CENTER}
        zIndex={zIndex.ARTIST_POPOVER_POPUP}
      >
        {content || <></>}
      </Popup>
    </Component>
  )
}

const mapStateToProps = (state: AppState, { handle = '' }) => ({
  creator: getUser(state, { handle: handle.toLowerCase() }),
  userId: getUserId(state)
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  goToRoute: (route: string) => dispatch(pushRoute(route)),
  onFollow: (userId: ID) =>
    dispatch(socialActions.followUser(userId, FollowSource.HOVER_TILE)),
  onUnfollow: (userId: ID) => {
    dispatch(socialActions.unfollowUser(userId, FollowSource.HOVER_TILE))
    dispatch(setNotificationSubscription(userId, false, true))
  }
})

ArtistPopover.defaultProps = {
  handle: '',
  mouseEnterDelay: 0.5
}

export default connect(mapStateToProps, mapDispatchToProps)(memo(ArtistPopover))
