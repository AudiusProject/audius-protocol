import { WidthSizes } from 'audius-client/src/common/models/ImageSizes'

import BadgeArtist from 'app/assets/images/badgeArtist.svg'
import { DynamicImage } from 'app/components/core'
import { useUserCoverPhoto } from 'app/hooks/useUserCoverPhoto'
import { makeStyles } from 'app/styles/makeStyles'

import { useSelectProfile } from './selectors'

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

export const CoverPhoto = () => {
  const styles = useStyles()
  const { user_id, _cover_photo_sizes, track_count } = useSelectProfile([
    'user_id',
    '_cover_photo_sizes',
    'track_count'
  ])

  const coverPhoto = useUserCoverPhoto({
    id: user_id,
    sizes: _cover_photo_sizes,
    size: WidthSizes.SIZE_2000
  })

  const isArtist = track_count > 0

  return (
    <DynamicImage
      uri={coverPhoto}
      styles={{ root: styles.imageRoot, image: styles.image }}
    >
      {isArtist ? <BadgeArtist style={styles.artistBadge} /> : null}
    </DynamicImage>
  )
}
