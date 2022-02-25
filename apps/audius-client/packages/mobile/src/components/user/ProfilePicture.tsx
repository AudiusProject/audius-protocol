import { SquareSizes } from 'audius-client/src/common/models/ImageSizes'
import { User } from 'audius-client/src/common/models/User'

import { DynamicImage, DynamicImageProps } from 'app/components/core'
import { useUserProfilePicture } from 'app/hooks/useUserProfilePicture'
import { makeStyles } from 'app/styles/makeStyles'

const useStyles = makeStyles(({ palette, spacing }) => ({
  profilePhoto: {
    height: 82,
    width: 82,
    borderRadius: 1000,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: palette.white,
    overflow: 'hidden',
    backgroundColor: palette.neutralLight6
  }
}))

type ProfilePhotoProps = Partial<DynamicImageProps> & {
  profile: User
}

export const ProfilePhoto = (props: ProfilePhotoProps) => {
  const { styles: stylesProp, profile, ...other } = props
  const styles = useStyles()

  const profilePicture = useUserProfilePicture(
    profile?.user_id,
    profile?._profile_picture_sizes,
    SquareSizes.SIZE_150_BY_150
  )

  return (
    <DynamicImage
      source={{ uri: profilePicture }}
      styles={{
        ...stylesProp,
        ...{
          root: styles.profilePhoto
        }
      }}
      {...other}
    />
  )
}
