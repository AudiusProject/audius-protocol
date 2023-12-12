import { ImageField } from 'app/components/fields'
import { makeStyles } from 'app/styles'

const messages = {
  label: 'Profile Picture'
}

const name = 'profile_picture'

const useStyles = makeStyles(({ palette }) => ({
  profilePicture: {
    position: 'absolute',
    top: 37,
    left: 11,
    height: 100,
    width: 100,
    borderRadius: 100 / 2,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: palette.white,
    backgroundColor: palette.neutralLight4,
    // this is so the profile picture overlays above the cover-photo
    zIndex: 100,
    overflow: 'hidden'
  },
  profilePictureImageContainer: {
    height: 'auto',
    width: 'auto'
  },
  profilePictureImage: {
    width: 'auto'
  }
}))

export const ProfilePictureField = () => {
  const styles = useStyles()

  return (
    <ImageField
      name={name}
      label={messages.label}
      styles={{
        root: styles.profilePicture,
        imageContainer: styles.profilePictureImageContainer,
        image: styles.profilePictureImage
      }}
    />
  )
}
