import { useState, useRef, useCallback, useEffect } from 'react'

import {
  ID,
  Name,
  CoverPhotoSizes,
  ProfilePictureSizes,
  WidthSizes,
  SquareSizes,
  formatCount,
  squashNewLines,
  imageCoverPhotoBlank
} from '@audius/common'
import {
  Button,
  ButtonType,
  ButtonSize,
  IconTwitterBird,
  IconInstagram,
  IconDonate,
  IconLink,
  IconTikTok
} from '@audius/stems'
import cn from 'classnames'
import Linkify from 'linkifyjs/react'

import { ReactComponent as BadgeArtist } from 'assets/img/badgeArtist.svg'
import { make, useRecord } from 'common/store/analytics/actions'
import { ArtistRecommendationsDropdown } from 'components/artist-recommendations/ArtistRecommendationsDropdown'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import FollowButton from 'components/follow-button/FollowButton'
import Skeleton from 'components/skeleton/Skeleton'
import SubscribeButton from 'components/subscribe-button/SubscribeButton'
import FollowsYouBadge from 'components/user-badges/FollowsYouBadge'
import ProfilePageBadge from 'components/user-badges/ProfilePageBadge'
import UserBadges from 'components/user-badges/UserBadges'
import { useUserCoverPhoto } from 'hooks/useUserCoverPhoto'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { FOLLOWING_USERS_ROUTE, FOLLOWERS_USERS_ROUTE } from 'utils/route'

import GrowingCoverPhoto from './GrowingCoverPhoto'
import styles from './ProfileHeader.module.css'
import UploadButton from './UploadButton'
import UploadStub from './UploadStub'

const messages = {
  tracks: 'Tracks',
  followers: 'Followers',
  following: 'Following',
  playlists: 'Playlists',
  showMore: 'Show More',
  showLess: 'Show Less',
  editProfile: 'EDIT PROFILE'
}

const LoadingProfileHeader = () => {
  return (
    <div className={styles.headerContainer}>
      <div className={cn(styles.coverPhoto, styles.loading)}>
        <Skeleton
          className={cn(styles.loadingSkeleton, styles.loadingSkeletonAvatar)}
        />
      </div>
      <div className={cn(styles.artistInfo, styles.loadingInfo)}>
        <div className={styles.loadingNameContainer}>
          <Skeleton
            className={cn(styles.loadingSkeleton, styles.loadingShortName)}
          />
        </div>
        <Skeleton className={cn(styles.loadingSkeleton)} />
        <Skeleton
          className={cn(styles.loadingSkeleton, styles.loadingShortDesc)}
        />
      </div>
    </div>
  )
}

type ProfileHeaderProps = {
  isDeactivated: boolean
  name: string
  handle: string
  isArtist: boolean
  bio: string
  verified: boolean
  userId: ID
  loading: boolean
  coverPhotoSizes: CoverPhotoSizes | null
  profilePictureSizes: ProfilePictureSizes | null
  hasProfilePicture: boolean
  playlistCount: number
  trackCount: number
  followerCount: number
  setFollowersUserId: (id: ID) => void
  followingCount: number
  setFollowingUserId: (id: ID) => void
  doesFollowCurrentUser: boolean
  twitterHandle: string
  instagramHandle: string
  tikTokHandle: string
  website: string
  donation: string
  followers: any
  goToRoute: (route: string) => void
  following: boolean
  isSubscribed: boolean
  mode: string
  onFollow: (id: ID) => void
  onUnfollow: (id: ID) => void
  switchToEditMode: () => void
  updatedCoverPhoto: string | null
  updatedProfilePicture: string | null
  onUpdateProfilePicture: (
    files: any,
    source: 'original' | 'unsplash' | 'url'
  ) => void
  onUpdateCoverPhoto: (
    files: any,
    source: 'original' | 'unsplash' | 'url'
  ) => void
  setNotificationSubscription: (userId: ID, isSubscribed: boolean) => void
  areArtistRecommendationsVisible: boolean
  onCloseArtistRecommendations: () => void
}

function isEllipsisActive(e: HTMLElement) {
  return e.offsetHeight < e.scrollHeight
}

const ProfileHeader = ({
  isDeactivated,
  name,
  handle,
  isArtist,
  bio,
  userId,
  loading,
  coverPhotoSizes,
  profilePictureSizes,
  playlistCount,
  trackCount,
  followerCount,
  followingCount,
  doesFollowCurrentUser,
  twitterHandle,
  instagramHandle,
  tikTokHandle,
  website,
  donation,
  setFollowersUserId,
  setFollowingUserId,
  goToRoute,
  following,
  isSubscribed,
  mode,
  onFollow,
  onUnfollow,
  switchToEditMode,
  updatedCoverPhoto,
  updatedProfilePicture,
  onUpdateCoverPhoto,
  onUpdateProfilePicture,
  setNotificationSubscription,
  areArtistRecommendationsVisible,
  onCloseArtistRecommendations
}: ProfileHeaderProps) => {
  const [hasEllipsis, setHasEllipsis] = useState(false)
  const [isDescriptionMinimized, setIsDescriptionMinimized] = useState(true)
  const bioRef = useRef<HTMLElement | null>(null)
  const isEditing = mode === 'editing'

  const bioRefCb = useCallback((node) => {
    if (node !== null) {
      const ellipsisActive = isEllipsisActive(node)
      if (ellipsisActive) {
        bioRef.current = node
        setHasEllipsis(true)
        node.style.height = '40px'
      }
    }
  }, [])

  useEffect(() => {
    const bioEl = bioRef.current
    if (bioEl && hasEllipsis) {
      if (isDescriptionMinimized) {
        bioEl.style.height = '40px'
      } else {
        bioEl.style.height = `${bioEl.scrollHeight}px`
      }
    }
  }, [hasEllipsis, isDescriptionMinimized])

  useEffect(() => {
    if ((website || donation) && !hasEllipsis) {
      setHasEllipsis(true)
    }
  }, [website, donation, hasEllipsis, setHasEllipsis])

  const coverPhoto = useUserCoverPhoto(
    userId,
    isDeactivated ? null : coverPhotoSizes,
    WidthSizes.SIZE_2000
  )
  let coverPhotoStyle = {}
  if (coverPhoto === imageCoverPhotoBlank) {
    coverPhotoStyle = {
      backgroundRepeat: 'repeat',
      backgroundSize: '300px 300px'
    }
  }
  const profilePicture = useUserProfilePicture(
    userId,
    isDeactivated ? null : profilePictureSizes,
    SquareSizes.SIZE_150_BY_150
  )
  const record = useRecord()

  const onGoToInstagram = useCallback(() => {
    record(
      make(Name.PROFILE_PAGE_CLICK_INSTAGRAM, {
        handle: handle.replace('@', ''),
        instagramHandle
      })
    )
    const win = window.open(
      `https://instagram.com/${instagramHandle}`,
      '_blank'
    )
    if (win) win.focus()
  }, [record, instagramHandle, handle])

  const onGoToTwitter = useCallback(() => {
    record(
      make(Name.PROFILE_PAGE_CLICK_TWITTER, {
        handle: handle.replace('@', ''),
        twitterHandle
      })
    )
    const win = window.open(`https://twitter.com/${twitterHandle}`, '_blank')
    if (win) win.focus()
  }, [record, twitterHandle, handle])

  const onGoToTikTok = useCallback(() => {
    record(
      make(Name.PROFILE_PAGE_CLICK_TIKTOK, {
        handle: handle.replace('@', ''),
        tikTokHandle
      })
    )
    const win = window.open(`https://tiktok.com/@${tikTokHandle}`, '_blank')
    if (win) win.focus()
  }, [record, tikTokHandle, handle])

  const onExternalLinkClick = useCallback(
    (event) => {
      record(
        make(Name.LINK_CLICKING, {
          url: event.target.href,
          source: 'profile page' as const
        })
      )
    },
    [record]
  )

  const onGoToFollowersPage = () => {
    setFollowersUserId(userId)
    goToRoute(FOLLOWERS_USERS_ROUTE)
  }

  const onGoToFollowingPage = () => {
    setFollowingUserId(userId)
    goToRoute(FOLLOWING_USERS_ROUTE)
  }

  const onGoToWebsite = () => {
    let link = website
    if (!/^https?/.test(link)) {
      link = `http://${link}`
    }
    const win = window.open(link, '_blank')
    if (win) win.focus()
    record(
      make(Name.PROFILE_PAGE_CLICK_WEBSITE, {
        handle,
        website
      })
    )
  }

  const onDonationLinkClick = useCallback(
    (event) => {
      record(
        make(Name.PROFILE_PAGE_CLICK_DONATION, {
          handle,
          donation: event.target.href
        })
      )
    },
    [record, handle]
  )

  const toggleNotificationSubscription = () => {
    setNotificationSubscription(userId, !isSubscribed)
  }

  // If we're not loading, we know that
  // nullable fields such as userId are valid.
  if (loading) {
    return <LoadingProfileHeader />
  }

  return (
    <div className={styles.headerContainer}>
      <GrowingCoverPhoto
        image={updatedCoverPhoto || coverPhoto}
        imageStyle={coverPhotoStyle}
        wrapperClassName={cn(styles.coverPhoto, {
          [styles.isEditing]: isEditing
        })}
      >
        {isArtist && !isEditing && !isDeactivated ? (
          <BadgeArtist className={styles.badgeArtist} />
        ) : null}
        {isEditing && <UploadStub onChange={onUpdateCoverPhoto} />}
      </GrowingCoverPhoto>
      <DynamicImage
        image={updatedProfilePicture || profilePicture}
        className={styles.profilePicture}
        wrapperClassName={cn(styles.profilePictureWrapper, {
          [styles.isEditing]: isEditing
        })}
      >
        {isEditing && <UploadStub onChange={onUpdateProfilePicture} />}
      </DynamicImage>
      {!isEditing && !isDeactivated && (
        <div className={styles.artistInfo}>
          <div className={styles.titleContainer}>
            <div className={styles.left}>
              <div className={styles.artistName}>
                <h1>
                  {`${name} `}
                  <span className={styles.badgesSpan}>
                    <UserBadges
                      userId={userId}
                      className={styles.iconVerified}
                      badgeSize={12}
                    />
                  </span>
                </h1>
              </div>
              <div className={styles.artistHandleWrapper}>
                <h2 className={styles.artistHandle}>{handle}</h2>
                {doesFollowCurrentUser ? <FollowsYouBadge /> : null}
              </div>
            </div>
            <div className={styles.right}>
              {following && (
                <SubscribeButton
                  className={styles.subscribeButton}
                  isSubscribed={isSubscribed}
                  isFollowing={following}
                  onToggleSubscribe={toggleNotificationSubscription}
                />
              )}
              {mode === 'owner' ? (
                <Button
                  className={styles.editButton}
                  textClassName={styles.editButtonText}
                  size={ButtonSize.SMALL}
                  type={ButtonType.SECONDARY}
                  text={messages.editProfile}
                  onClick={switchToEditMode}
                />
              ) : (
                <FollowButton
                  size='small'
                  following={following}
                  onFollow={() => onFollow(userId)}
                  onUnfollow={() => onUnfollow(userId)}
                />
              )}
            </div>
          </div>
          <div className={styles.artistMetrics}>
            <div className={styles.artistMetric}>
              <div className={styles.artistMetricValue}>
                {formatCount(isArtist ? trackCount : playlistCount)}
              </div>
              <div className={styles.artistMetricLabel}>
                {isArtist ? messages.tracks : messages.playlists}
              </div>
            </div>
            <div
              className={styles.artistMetric}
              onClick={followerCount! > 0 ? onGoToFollowersPage : () => {}}
            >
              <div className={styles.artistMetricValue}>
                {formatCount(followerCount)}
              </div>
              <div className={styles.artistMetricLabel}>
                {messages.followers}
              </div>
            </div>
            <div
              className={styles.artistMetric}
              onClick={followingCount! > 0 ? onGoToFollowingPage : () => {}}
            >
              <div className={styles.artistMetricValue}>
                {formatCount(followingCount)}
              </div>
              <div className={styles.artistMetricLabel}>
                {messages.following}
              </div>
            </div>
          </div>
          <div className={styles.socials}>
            <ProfilePageBadge
              userId={userId}
              isCompact
              className={styles.badge}
            />
            {twitterHandle && (
              <IconTwitterBird
                className={cn(styles.socialIcon)}
                onClick={onGoToTwitter}
              />
            )}
            {instagramHandle && (
              <IconInstagram
                className={cn(styles.socialIcon)}
                onClick={onGoToInstagram}
              />
            )}
            {tikTokHandle && (
              <IconTikTok
                className={cn(styles.socialIcon)}
                onClick={onGoToTikTok}
              />
            )}
          </div>
          {bio ? (
            // https://github.com/Soapbox/linkifyjs/issues/292
            // @ts-ignore
            <Linkify options={{ attributes: { onClick: onExternalLinkClick } }}>
              <div
                ref={bioRefCb}
                className={cn(styles.bio, {
                  [styles.bioExpanded]: hasEllipsis && !isDescriptionMinimized
                })}
              >
                {squashNewLines(bio)}
              </div>
            </Linkify>
          ) : null}
          {hasEllipsis && !isDescriptionMinimized && (website || donation) && (
            <div className={styles.sites}>
              {website && (
                <div className={styles.website} onClick={onGoToWebsite}>
                  <IconLink className={cn(styles.socialIcon)} />
                  <span>{website}</span>
                </div>
              )}
              {donation && (
                <div className={styles.donation}>
                  <IconDonate
                    className={cn(styles.socialIcon)}
                    onClick={onGoToInstagram}
                  />
                  <span>
                    <Linkify
                      options={{
                        // https://github.com/Soapbox/linkifyjs/issues/292
                        // @ts-ignore
                        attributes: { onClick: onDonationLinkClick }
                      }}
                    >
                      {donation}
                    </Linkify>
                  </span>
                </div>
              )}
            </div>
          )}
          {hasEllipsis ? (
            <div
              className={styles.expandDescription}
              onClick={() => setIsDescriptionMinimized(!isDescriptionMinimized)}
            >
              {isDescriptionMinimized ? messages.showMore : messages.showLess}
            </div>
          ) : null}
          <ArtistRecommendationsDropdown
            isVisible={areArtistRecommendationsVisible}
            renderHeader={() => (
              <p>Here are some accounts that vibe well with {name}</p>
            )}
            artistId={userId}
            onClose={onCloseArtistRecommendations}
          />
        </div>
      )}
      {mode === 'owner' && !isEditing && <UploadButton />}
    </div>
  )
}

export default ProfileHeader
