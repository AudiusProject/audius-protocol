import { useCallback } from 'react'

import { SquareSizes, WidthSizes, User } from '@audius/common/models'
import { IconArtistBadge as BadgeArtist } from '@audius/harmony'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import FollowsYouBadge from 'components/user-badges/FollowsYouBadge'
import UserBadges from 'components/user-badges/UserBadges'
import { useCoverPhoto } from 'hooks/useCoverPhoto'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { profilePage } from 'utils/route'

import styles from './ArtistCardCover.module.css'

const gradient = `linear-gradient(180deg, rgba(0, 0, 0, 0.001) 0%, rgba(0, 0, 0, 0.005) 67.71%, rgba(0, 0, 0, 0.15) 79.17%, rgba(0, 0, 0, 0.25) 100%)`

type ArtistCoverProps = {
  artist: User
  isArtist: boolean
  onNavigateAway?: () => void
}

export const ArtistCardCover = (props: ArtistCoverProps) => {
  const { isArtist, artist, onNavigateAway } = props

  const { user_id, name, handle, _profile_picture_sizes } = artist
  const dispatch = useDispatch()

  const { source: coverPhoto, shouldBlur } = useCoverPhoto(
    user_id,
    WidthSizes.SIZE_640
  )
  const profilePicture = useUserProfilePicture(
    user_id,
    _profile_picture_sizes,
    SquareSizes.SIZE_150_BY_150
  )

  const darkenedCoverPhoto = `${gradient}, url(${coverPhoto})`

  const handleClickUser = useCallback(() => {
    if (onNavigateAway) {
      onNavigateAway()
    }
    dispatch(push(profilePage(handle)))
  }, [dispatch, handle, onNavigateAway])

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
          skeletonClassName={styles.profilePictureSkeleton}
          className={styles.profilePicture}
          image={profilePicture}
          immediate
        />
        <div className={styles.headerTextContainer}>
          <div className={styles.nameContainer}>
            <div className={styles.artistName} onClick={handleClickUser}>
              {name}
            </div>
            <UserBadges
              userId={user_id}
              badgeSize={14}
              className={styles.iconVerified}
              useSVGTiers
            />
          </div>
          <div className={styles.artistHandleWrapper}>
            <div
              className={styles.artistHandle}
              onClick={handleClickUser}
            >{`@${handle}`}</div>
            <FollowsYouBadge userId={user_id} />
          </div>
        </div>
      </div>
    </DynamicImage>
  )
}
