import { SquareSizes } from 'audius-client/src/common/models/ImageSizes'
import { ProfileUser } from 'audius-client/src/common/store/pages/profile/types'

import { DynamicImage } from 'app/components/core'
import { useUserProfilePicture } from 'app/hooks/useUserProfilePicture'
import { makeStyles } from 'app/styles/makeStyles'

const useStyles = makeStyles(({ palette, spacing }) => ({
  profilePhoto: {
    position: 'absolute',
    top: 37,
    left: 11,
    height: 82,
    width: 82,
    borderRadius: 82 / 2,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: palette.white,
    zIndex: 100,
    overflow: 'hidden'
  },
  profilePhotoImage: {
    backgroundColor: palette.neutral
  }
}))

type ProfilePhotoProps = {
  profile: ProfileUser
}

export const ProfilePhoto = ({ profile }: ProfilePhotoProps) => {
  const styles = useStyles()

  const profilePicture = useUserProfilePicture(
    profile?.user_id ?? null,
    profile?._profile_picture_sizes ?? null,
    SquareSizes.SIZE_150_BY_150
  )
  return (
    <DynamicImage
      source={{ uri: profilePicture }}
      styles={{
        root: styles.profilePhoto,
        image: styles.profilePhotoImage
      }}
    />
  )
}
