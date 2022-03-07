import { WidthSizes } from 'audius-client/src/common/models/ImageSizes'
import { User } from 'audius-client/src/common/models/User'

import BadgeArtist from 'app/assets/images/badgeArtist.svg'
import imageCoverPhotoBlank from 'app/assets/images/imageCoverPhotoBlank.jpg'
import { DynamicImage } from 'app/components/core'
import { useUserCoverPhoto } from 'app/hooks/useUserCoverPhoto'
import { makeStyles } from 'app/styles/makeStyles'

const useStyles = makeStyles(({ spacing }) => ({
  artistBadge: {
    position: 'absolute',
    top: spacing(5),
    right: spacing(3)
  },
  imageRoot: {
    height: 96
  },
  image: {
    height: '100%'
  }
}))

type CoverPhotoProps = {
  profile: User
}

export const CoverPhoto = ({ profile }: CoverPhotoProps) => {
  const styles = useStyles()
  const { user_id, _cover_photo_sizes, track_count } = profile

  const coverPhoto = useUserCoverPhoto(
    user_id,
    _cover_photo_sizes,
    WidthSizes.SIZE_2000
  )

  const source = coverPhoto?.match(/imageCoverPhotoBlank/)
    ? imageCoverPhotoBlank
    : { uri: coverPhoto }

  const isArtist = track_count > 0

  return (
    <DynamicImage
      source={source}
      styles={{ root: styles.imageRoot, image: styles.image }}
    >
      {isArtist ? <BadgeArtist style={styles.artistBadge} /> : null}
    </DynamicImage>
  )
}
