import React, { useCallback, memo, ReactNode } from 'react'

import Popover from 'antd/lib/popover'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { FollowSource } from 'common/models/Analytics'
import { ID } from 'common/models/Identifiers'
import { WidthSizes, SquareSizes } from 'common/models/ImageSizes'
import { getUserId } from 'common/store/account/selectors'
import { getUser } from 'common/store/cache/users/selectors'
import * as socialActions from 'common/store/social/users/actions'
import { MountPlacement } from 'components/types'
import { setNotificationSubscription } from 'containers/profile-page/store/actions'
import { useUserCoverPhoto, useUserProfilePicture } from 'hooks/useImageSize'
import { AppState } from 'store/types'
import { profilePage } from 'utils/route'

import ArtistCard from './ArtistCard'
import styles from './ArtistPopover.module.css'

enum Placement {
  Top = 'top',
  Left = 'left',
  Right = 'right',
  Bottom = 'bottom',
  TopLeft = 'topLeft',
  TopRight = 'topRight',
  BottomLeft = 'bottomLeft',
  BottomRight = 'bottomRight',
  LeftTop = 'leftTop',
  LeftBottom = 'leftBottom',
  RightTop = 'rightTop',
  RightBottom = 'rightBottom'
}

type ArtistPopoverProps = {
  mount: MountPlacement
  handle: string
  placement: Placement
  creator: any
  goToRoute: (route: string) => void
  onFollow: (userId: ID) => void
  onUnfollow: (userId: ID) => void
  children: ReactNode
  mouseEnterDelay: number
} & ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ArtistPopover = ({
  handle,
  onFollow,
  onUnfollow,
  children,
  placement,
  creator,
  userId,
  goToRoute,
  mount,
  mouseEnterDelay
}: ArtistPopoverProps) => {
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
  }, [getCoverPhoto, getProfilePicture])

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

  let popupContainer
  switch (mount) {
    case MountPlacement.PARENT:
      popupContainer = (triggerNode: HTMLElement) =>
        triggerNode.parentNode as HTMLElement
      break
    case MountPlacement.PAGE:
      popupContainer = () => document.getElementById('page') || document.body
      break
    default:
      popupContainer = undefined
  }

  return (
    <div
      className={cn(styles.popoverContainer, 'artistPopover')}
      onMouseEnter={onMouseEnter}
    >
      <Popover
        mouseEnterDelay={mouseEnterDelay}
        content={content}
        overlayClassName={styles.overlayStyle}
        placement={placement}
        getPopupContainer={popupContainer}
      >
        {children}
      </Popover>
    </div>
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
  mount: MountPlacement.PAGE,
  handle: '',
  placement: Placement.RightBottom,
  mouseEnterDelay: 0.5
}

export default connect(mapStateToProps, mapDispatchToProps)(memo(ArtistPopover))
