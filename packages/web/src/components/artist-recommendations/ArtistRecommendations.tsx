import { forwardRef, ReactNode, useCallback, useEffect, useState } from 'react'

import {
  ID,
  FollowSource,
  Name,
  ProfilePictureSizes,
  SquareSizes,
  User,
  relatedArtistsUISelectors,
  relatedArtistsUIActions,
  usersSocialActions as socialActions,
  cacheUsersSelectors,
  CommonState
} from '@audius/common'
import { IconClose } from '@audius/harmony'
import cn from 'classnames'
import { push } from 'connected-react-router'
import { isEmpty } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { make, useRecord } from 'common/store/analytics/actions'
import { ArtistPopover } from 'components/artist/ArtistPopover'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { FollowButton } from 'components/follow-button/FollowButton'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { MountPlacement } from 'components/types'
import UserBadges from 'components/user-badges/UserBadges'
import { useIsMobile } from 'hooks/useIsMobile'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { profilePage } from 'utils/route'

import styles from './ArtistRecommendations.module.css'
const { selectSuggestedFollowsUsers } = relatedArtistsUISelectors
const { fetchRelatedArtists } = relatedArtistsUIActions
const { getUsers } = cacheUsersSelectors

export type ArtistRecommendationsProps = {
  itemClassName?: string
  className?: string
  renderHeader: () => ReactNode
  renderSubheader?: () => ReactNode
  artistId: ID
  onClose: () => void
}

const messages = {
  follow: 'Follow All',
  unfollow: 'Unfollow All',
  following: 'Following',
  featuring: 'Featuring'
}
const ArtistProfilePictureWrapper = ({
  userId,
  handle,
  profilePictureSizes
}: {
  userId: number
  handle: string
  profilePictureSizes: ProfilePictureSizes | null
}) => {
  const profilePicture = useUserProfilePicture(
    userId,
    profilePictureSizes,
    SquareSizes.SIZE_150_BY_150
  )
  const isMobile = useIsMobile()
  if (isMobile) {
    return (
      <DynamicImage className={styles.profilePicture} image={profilePicture} />
    )
  }
  return (
    <ArtistPopover mount={MountPlacement.PARENT} handle={handle}>
      <div>
        <DynamicImage
          className={styles.profilePicture}
          image={profilePicture}
        />
      </div>
    </ArtistPopover>
  )
}

const ArtistPopoverWrapper = ({
  userId,
  handle,
  name,
  onArtistNameClicked,
  closeParent
}: {
  userId: ID
  handle: string
  name: string
  onArtistNameClicked: (handle: string) => void
  closeParent: () => void
}) => {
  const onArtistNameClick = useCallback(() => {
    onArtistNameClicked(handle)
    closeParent()
  }, [onArtistNameClicked, handle, closeParent])
  const isMobile = useIsMobile()
  return (
    <div className={styles.artistLink} role='link' onClick={onArtistNameClick}>
      {!isMobile ? (
        <ArtistPopover mount={MountPlacement.PARENT} handle={handle}>
          {name}
        </ArtistPopover>
      ) : (
        name
      )}
      <UserBadges
        userId={userId}
        className={styles.verified}
        badgeSize={10}
        inline={true}
      />
    </div>
  )
}

export const ArtistRecommendations = forwardRef<
  HTMLDivElement,
  ArtistRecommendationsProps
>((props, ref) => {
  const {
    className,
    itemClassName,
    artistId,
    renderHeader,
    renderSubheader,
    onClose
  } = props
  const dispatch = useDispatch()

  const [idsToFollow, setIdsToFollow] = useState<ID[] | null>(null)
  const artistsToFollow = useSelector<CommonState, User[]>((state) =>
    Object.values(getUsers(state, { ids: idsToFollow }))
  )

  // Start fetching the related artists
  useEffect(() => {
    dispatch(
      fetchRelatedArtists({
        artistId
      })
    )
  }, [dispatch, artistId])

  const suggestedArtists = useSelector<CommonState, User[]>((state) =>
    selectSuggestedFollowsUsers(state, { id: artistId })
  )
  useEffect(() => {
    if (!isEmpty(suggestedArtists)) {
      setIdsToFollow(suggestedArtists.map((user) => user.user_id))
    }
  }, [suggestedArtists])

  // Follow/Unfollow listeners
  const handleFollowAll = useCallback(() => {
    if (!artistsToFollow) return
    artistsToFollow.forEach((a) => {
      dispatch(
        socialActions.followUser(
          a.user_id,
          FollowSource.ARTIST_RECOMMENDATIONS_POPUP
        )
      )
    })
  }, [dispatch, artistsToFollow])

  const handleUnfollowAll = useCallback(() => {
    if (!artistsToFollow) return
    artistsToFollow.forEach((a) => {
      dispatch(
        socialActions.unfollowUser(
          a.user_id,
          FollowSource.ARTIST_RECOMMENDATIONS_POPUP
        )
      )
    })
  }, [dispatch, artistsToFollow])

  // Navigate to profile pages on artist links
  const onArtistNameClicked = useCallback(
    (handle: string) => {
      dispatch(push(profilePage(handle)))
    },
    [dispatch]
  )

  const isFollowingAll =
    artistsToFollow?.length > 0 &&
    artistsToFollow.every((a) => a.does_current_user_follow)
  const isLoading =
    !isFollowingAll && (!suggestedArtists || suggestedArtists.length === 0)

  const renderMainContent = () => {
    if (isLoading) return <LoadingSpinner className={styles.spinner} />
    return (
      <>
        <div
          className={cn(
            styles.profilePictureList,
            styles.contentItem,
            itemClassName
          )}
        >
          {artistsToFollow.map((a) => (
            <div key={a.user_id} className={styles.profilePictureWrapper}>
              <ArtistProfilePictureWrapper
                userId={a.user_id}
                handle={a.handle}
                profilePictureSizes={a._profile_picture_sizes}
              />
            </div>
          ))}
        </div>
        <div className={cn(styles.contentItem, itemClassName)}>
          {`${messages.featuring} `}
          {artistsToFollow
            .slice(0, 3)
            .map<ReactNode>((a, i) => (
              <ArtistPopoverWrapper
                key={a.user_id}
                userId={a.user_id}
                handle={a.handle}
                name={a.name}
                onArtistNameClicked={onArtistNameClicked}
                closeParent={onClose}
              />
            ))
            .reduce((prev, curr) => [prev, ', ', curr])}
          {artistsToFollow.length > 3
            ? `, and ${artistsToFollow.length - 3} others.`
            : ''}
        </div>
      </>
    )
  }

  const record = useRecord()
  useEffect(() => {
    record(
      make(Name.PROFILE_PAGE_SHOWN_ARTIST_RECOMMENDATIONS, {
        userId: artistId
      })
    )
  }, [record, artistId])

  return (
    <div className={cn(styles.content, className)} ref={ref}>
      <div className={cn(styles.headerBar, styles.contentItem, itemClassName)}>
        <div
          role='button'
          title='Dismiss'
          className={styles.closeButton}
          onClick={onClose}
        >
          <IconClose className={cn(styles.icon, styles.remove)} />
        </div>
        {renderHeader()}
      </div>
      {renderSubheader && renderSubheader()}
      {renderMainContent()}
      <div className={cn(styles.contentItem, itemClassName)}>
        <FollowButton
          isDisabled={isLoading}
          following={isFollowingAll}
          invertedColor={true}
          messages={messages}
          size='full'
          onFollow={handleFollowAll}
          onUnfollow={handleUnfollowAll}
        />
      </div>
    </div>
  )
})
