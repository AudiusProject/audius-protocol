import type { Nullable, User } from '@audius/common'
import { SquareSizes } from '@audius/common'

import type { DynamicImageProps } from 'app/components/core'
import { DynamicImage } from 'app/components/core'
import { useUserProfilePicture } from 'app/hooks/useUserProfilePicture'
import { makeStyles } from 'app/styles/makeStyles'

const useStyles = makeStyles(({ palette }) => ({
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

export type ProfilePictureProps = Partial<DynamicImageProps> & {
  profile: Nullable<Pick<User, 'user_id' | '_profile_picture_sizes' | 'handle'>>
}

export const ProfilePicture = (props: ProfilePictureProps) => {
  const { styles: stylesProp, profile, ...other } = props
  const styles = useStyles()

  const profilePicture = useUserProfilePicture({
    id: profile?.user_id,
    sizes: profile?._profile_picture_sizes,
    size: SquareSizes.SIZE_150_BY_150
  })

  return (
    <DynamicImage
      uri={profilePicture}
      styles={{
        ...stylesProp,
        ...{
          root: {
            ...styles.profilePhoto
          }
        }
      }}
      {...other}
    />
  )
}
