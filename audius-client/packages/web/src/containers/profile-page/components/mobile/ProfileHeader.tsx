import React, { useState, useRef, useCallback, useEffect } from 'react'
import cn from 'classnames'
import Linkify from 'linkifyjs/react'
import Skeleton from 'antd/lib/skeleton'
import {
  Button,
  ButtonType,
  ButtonSize,
  IconTwitterBird,
  IconInstagram,
  IconDonate,
  IconLink
} from '@audius/stems'

import {
  CoverPhotoSizes,
  ProfilePictureSizes,
  WidthSizes,
  SquareSizes
} from 'models/common/ImageSizes'
import { ID } from 'models/common/Identifiers'
import { useUserCoverPhoto, useUserProfilePicture } from 'hooks/useImageSize'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { FOLLOWING_USERS_ROUTE, FOLLOWERS_USERS_ROUTE } from 'utils/route'
import { formatCount, squashNewLines } from 'utils/formatUtil'

import { ReactComponent as BadgeArtist } from 'assets/img/badgeArtist.svg'
import imageCoverPhotoBlank from 'assets/img/imageCoverPhotoBlank.jpg'
import styles from './ProfileHeader.module.css'
import FollowButton from 'components/general/FollowButton'
import GrowingCoverPhoto from './GrowingCoverPhoto'
import UploadStub from './UploadStub'
import SubscribeButton from 'components/general/SubscribeButton'
import { make, useRecord } from 'store/analytics/actions'
import { Name } from 'services/analytics'
import UploadButton from './UploadButton'
import UserBadges from 'containers/user-badges/UserBadges'
import ProfilePageBadge from 'containers/user-badges/ProfilePageBadge'

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
          avatar
          active
          title={false}
          paragraph={false}
          className={cn(styles.loadingSkeleton, styles.loadingSkeletonAvatar)}
        />
      </div>
      <div className={cn(styles.artistInfo, styles.loadingInfo)}>
        <div className={styles.loadingNameContainer}>
          <Skeleton
            title={false}
            paragraph={{ rows: 1 }}
            active
            className={cn(styles.loadingShortName)}
          />
        </div>
        <Skeleton
          title={false}
          paragraph={{ rows: 2 }}
          active
          className={cn(styles.loadingSkeleton)}
        />
      </div>
    </div>
  )
}

type ProfileHeaderProps = {
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
  twitterHandle: string
  instagramHandle: string
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
  onUpdateProfilePicture: (files: any, source: 'original' | 'unsplash') => void
  onUpdateCoverPhoto: (files: any, source: 'original' | 'unsplash') => void
  setNotificationSubscription: (userId: ID, isSubscribed: boolean) => void
}

function isEllipsisActive(e: HTMLElement) {
  return e.offsetHeight < e.scrollHeight
}

const ProfileHeader = ({
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
  twitterHandle,
  instagramHandle,
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
  setNotificationSubscription
}: ProfileHeaderProps) => {
  const [hasEllipsis, setHasEllipsis] = useState(false)
  const [isDescriptionMinimized, setIsDescriptionMinimized] = useState(true)
  const bioRef = useRef<HTMLElement | null>(null)
  const isEditing = mode === 'editing'

  const bioRefCb = useCallback(node => {
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
    coverPhotoSizes,
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
    profilePictureSizes,
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

  const onExternalLinkClick = useCallback(
    event => {
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
    event => {
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
        {isArtist && !isEditing ? (
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
      {!isEditing && (
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
              <h2 className={styles.artistHandle}>{handle}</h2>
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
        </div>
      )}
      {mode === 'owner' && !isEditing && <UploadButton />}
    </div>
  )
}

export default ProfileHeader
