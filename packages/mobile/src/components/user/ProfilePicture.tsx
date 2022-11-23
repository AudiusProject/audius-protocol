import type { DynamicImageProps } from 'app/components/core'
import type { UserImageProps } from 'app/components/image/UserImage'
import { UserImage } from 'app/components/image/UserImage'
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
  profile: UserImageProps['user']
}

export const ProfilePicture = (props: ProfilePictureProps) => {
  const { styles: stylesProp, profile, ...other } = props
  const styles = useStyles()

  return (
    <UserImage
      immediate
      user={profile}
      styles={{
        ...stylesProp,
        root: {
          ...styles.profilePhoto
        }
      }}
      {...other}
    />
  )
}
