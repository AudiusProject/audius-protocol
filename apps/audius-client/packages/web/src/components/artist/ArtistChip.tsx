import { ComponentPropsWithoutRef } from 'react'

import { ID, SquareSizes, User } from '@audius/common'
import cn from 'classnames'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { MountPlacement } from 'components/types'
import UserBadges from 'components/user-badges/UserBadges'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { USER_LIST_TAG as SUPPORTING_USER_LIST_TAG } from 'pages/supporting-page/sagas'
import { USER_LIST_TAG as TOP_SUPPORTERS_USER_LIST_TAG } from 'pages/top-supporters-page/sagas'

import styles from './ArtistChip.module.css'
import { ArtistChipFollowers } from './ArtistChipFollowers'
import { ArtistChipTips } from './ArtistChipTips'

const TIP_SUPPORT_TAGS = new Set([
  SUPPORTING_USER_LIST_TAG,
  TOP_SUPPORTERS_USER_LIST_TAG
])

type ArtistIdentifierProps = {
  userId: ID
  name: string
  handle: string
  showPopover: boolean
  popoverMount?: MountPlacement
  onNavigateAway?: () => void
} & ComponentPropsWithoutRef<'div'>
const ArtistIdentifier = ({
  userId,
  name,
  handle,
  showPopover,
  popoverMount,
  onNavigateAway
}: ArtistIdentifierProps) => {
  return showPopover ? (
    <div>
      <ArtistPopover
        handle={handle}
        mouseEnterDelay={0.3}
        mount={popoverMount}
        onNavigateAway={onNavigateAway}
      >
        <div className={styles.name}>
          <span>{name}</span>
          <UserBadges
            userId={userId}
            className={cn(styles.badge)}
            badgeSize={10}
            inline
          />
        </div>
      </ArtistPopover>
      <ArtistPopover
        handle={handle}
        mouseEnterDelay={0.3}
        mount={popoverMount}
        onNavigateAway={onNavigateAway}
      >
        <div className={styles.handle}>@{handle}</div>
      </ArtistPopover>
    </div>
  ) : (
    <div>
      <div className={styles.name}>
        <span>{name}</span>
        <UserBadges
          userId={userId}
          className={cn(styles.badge)}
          badgeSize={10}
          inline
        />
      </div>
      <div className={styles.handle}>@{handle}</div>
    </div>
  )
}

type ArtistChipProps = {
  user: User
  onClickArtistName: () => void
  showPopover?: boolean
  tag?: string
  className?: string
  popoverMount?: MountPlacement
  onNavigateAway?: () => void
}
const ArtistChip = ({
  user,
  onClickArtistName,
  showPopover = true,
  tag,
  className = '',
  popoverMount = MountPlacement.PAGE,
  onNavigateAway
}: ArtistChipProps) => {
  const {
    user_id: userId,
    name,
    handle,
    _profile_picture_sizes: profilePictureSizes,
    follower_count: followers,
    does_follow_current_user: doesFollowCurrentUser
  } = user

  const profilePicture = useUserProfilePicture(
    userId,
    profilePictureSizes,
    SquareSizes.SIZE_150_BY_150
  )

  return (
    <div
      className={cn(styles.artistChip, {
        [className]: !!className
      })}
      onClick={onClickArtistName}
    >
      {showPopover ? (
        <ArtistPopover
          handle={handle}
          mouseEnterDelay={0.3}
          mount={popoverMount}
          onNavigateAway={onNavigateAway}
        >
          <DynamicImage
            wrapperClassName={styles.profilePictureWrapper}
            skeletonClassName={styles.profilePictureSkeleton}
            className={styles.profilePicture}
            image={profilePicture}
          />
        </ArtistPopover>
      ) : (
        <DynamicImage
          wrapperClassName={styles.profilePictureWrapper}
          skeletonClassName={styles.profilePictureSkeleton}
          className={styles.profilePicture}
          image={profilePicture}
        />
      )}
      <div className={styles.text}>
        <div className={cn(styles.identity, 'name')}>
          <ArtistIdentifier
            userId={userId}
            name={name}
            handle={handle}
            showPopover
            popoverMount={popoverMount}
            onNavigateAway={onNavigateAway}
          />
        </div>
        <ArtistChipFollowers
          followerCount={followers}
          doesFollowCurrentUser={!!doesFollowCurrentUser}
        />
        {tag && TIP_SUPPORT_TAGS.has(tag) ? (
          <ArtistChipTips artistId={user.user_id} tag={tag} />
        ) : null}
      </div>
    </div>
  )
}

export default ArtistChip
