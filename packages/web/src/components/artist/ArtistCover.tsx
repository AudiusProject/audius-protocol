import {
  SquareSizes,
  WidthSizes,
  ID,
  ProfilePictureSizes,
  CoverPhotoSizes
} from '@audius/common/models'
import {} from '@audius/common'

import BadgeArtist from 'assets/img/badgeArtist.svg'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import FollowsYouBadge from 'components/user-badges/FollowsYouBadge'
import UserBadges from 'components/user-badges/UserBadges'
import { useCoverPhoto } from 'hooks/useCoverPhoto'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'

import styles from './ArtistCard.module.css'

const gradient = `linear-gradient(180deg, rgba(0, 0, 0, 0.001) 0%, rgba(0, 0, 0, 0.005) 67.71%, rgba(0, 0, 0, 0.15) 79.17%, rgba(0, 0, 0, 0.25) 100%)`

type ArtistCoverProps = {
  userId: ID
  name: string
  handle: string
  isArtist: boolean
  onNameClick: () => void
  coverPhotoSizes: CoverPhotoSizes
  profilePictureSizes: ProfilePictureSizes
}

export const ArtistCover = ({
  userId,
  name,
  handle,
  isArtist,
  onNameClick,
  profilePictureSizes,
  coverPhotoSizes
}: ArtistCoverProps) => {
  const { source: coverPhoto, shouldBlur } = useCoverPhoto(
    userId,
    WidthSizes.SIZE_640
  )
  const profilePicture = useUserProfilePicture(
    userId,
    profilePictureSizes,
    SquareSizes.SIZE_150_BY_150
  )

  const darkenedCoverPhoto = `${gradient}, url(${coverPhoto})`

  return (
    <DynamicImage
      wrapperClassName={styles.artistCoverPhoto}
      image={darkenedCoverPhoto}
      immediate
      useBlur={shouldBlur}
    >
      <div className={styles.coverPhotoContentContainer}>
        {isArtist ? <BadgeArtist className={styles.badgeArtist} /> : null}
        <DynamicImage
          wrapperClassName={styles.profilePictureWrapper}
          className={styles.profilePicture}
          image={profilePicture}
          immediate
        />
        <div className={styles.headerTextContainer}>
          <div className={styles.nameContainer}>
            <div className={styles.artistName} onClick={onNameClick}>
              {name}
            </div>
            <UserBadges
              userId={userId}
              badgeSize={14}
              className={styles.iconVerified}
              useSVGTiers
            />
          </div>
          <div className={styles.artistHandleWrapper}>
            <div
              className={styles.artistHandle}
              onClick={onNameClick}
            >{`@${handle}`}</div>
            <FollowsYouBadge userId={userId} />
          </div>
        </div>
      </div>
    </DynamicImage>
  )
}
