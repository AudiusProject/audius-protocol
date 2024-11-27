import { useCallback } from 'react'

import { imageCoverPhotoBlank } from '@audius/common/assets'
import { SquareSizes, WidthSizes, User } from '@audius/common/models'
import { route } from '@audius/common/utils'
import { IconArtistBadge as BadgeArtist } from '@audius/harmony'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import FollowsYouBadge from 'components/user-badges/FollowsYouBadge'
import UserBadges from 'components/user-badges/UserBadges'
import { useCoverPhoto3 } from 'hooks/useCoverPhoto'
import { useProfilePicture3 } from 'hooks/useUserProfilePicture'

import styles from './ArtistCardCover.module.css'

const { profilePage } = route
const gradient = `linear-gradient(180deg, rgba(0, 0, 0, 0.001) 0%, rgba(0, 0, 0, 0.005) 67.71%, rgba(0, 0, 0, 0.15) 79.17%, rgba(0, 0, 0, 0.25) 100%)`

type ArtistCoverProps = {
  artist: User
  isArtist: boolean
  onNavigateAway?: () => void
}

export const ArtistCardCover = (props: ArtistCoverProps) => {
  const { isArtist, artist, onNavigateAway } = props

  const { user_id, name, handle } = artist
  const dispatch = useDispatch()

  const coverPhoto = useCoverPhoto3({
    userId: user_id,
    size: WidthSizes.SIZE_640,
    defaultImage: imageCoverPhotoBlank
  })
  const profilePicture = useProfilePicture3({
    userId: user_id,
    size: SquareSizes.SIZE_150_BY_150
  })

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
      useBlur={coverPhoto === imageCoverPhotoBlank}
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
