import { SquareSizes, WidthSizes, ID } from '@audius/common/models'
import {} from '@audius/common'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { Text } from 'components/typography'
import UserBadges from 'components/user-badges/UserBadges'
import { useCoverPhoto } from 'hooks/useCoverPhoto'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useProfilePicture } from 'hooks/useUserProfilePicture'
import { profilePage } from 'utils/route'

import styles from './ArtistCard.module.css'

type ArtistCardProps = {
  userId: ID
  handle: string
  name: string
}

export const ArtistCard = ({ userId, handle, name }: ArtistCardProps) => {
  const profilePicture = useProfilePicture(userId, SquareSizes.SIZE_150_BY_150)
  const { source: coverPhoto, shouldBlur } = useCoverPhoto(
    userId,
    WidthSizes.SIZE_2000
  )
  const navigate = useNavigateToPage()

  return (
    <div className={styles.root} onClick={() => navigate(profilePage(handle))}>
      <DynamicImage
        className={styles.coverPhoto}
        wrapperClassName={styles.coverPhotoWrapper}
        image={coverPhoto}
        useBlur={shouldBlur}
      />
      <div className={styles.details}>
        <DynamicImage
          className={styles.profilePicture}
          wrapperClassName={styles.profilePictureWrapper}
          image={profilePicture}
        />
        <div className={styles.info}>
          <div className={styles.name}>
            <Text size='large' strength='default' variant='title'>
              {name}
            </Text>
            <UserBadges userId={userId} badgeSize={14} useSVGTiers />
          </div>
          <Text size='large' strength='default' variant='body'>
            {`@${handle}`}
          </Text>
        </div>
      </div>
    </div>
  )
}
