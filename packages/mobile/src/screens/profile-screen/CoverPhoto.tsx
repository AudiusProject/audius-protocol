import { WidthSizes } from 'audius-client/src/common/models/ImageSizes'
import { ProfileUser } from 'audius-client/src/common/store/pages/profile/types'

import BadgeArtist from 'app/assets/images/badgeArtist.svg'
import { DynamicImage } from 'app/components/core'
import { useUserCoverPhoto } from 'app/hooks/useUserCoverPhoto'
import { makeStyles } from 'app/styles/makeStyles'

const useStyles = makeStyles(({ spacing }) => ({
  artistBadge: {
    position: 'absolute',
    top: spacing(5),
    right: spacing(3)
  }
}))

type CoverPhotoProps = {
  profile: ProfileUser
}

export const CoverPhoto = ({ profile }: CoverPhotoProps) => {
  const styles = useStyles()
  const { user_id, _cover_photo_sizes, track_count } = profile

  const coverPhoto = useUserCoverPhoto(
    user_id,
    _cover_photo_sizes,
    WidthSizes.SIZE_2000
  )

  const isArtist = track_count > 0

  return (
    <DynamicImage source={{ uri: coverPhoto }} style={{ height: 96 }}>
      {isArtist ? <BadgeArtist style={styles.artistBadge} /> : null}
    </DynamicImage>
  )
}
