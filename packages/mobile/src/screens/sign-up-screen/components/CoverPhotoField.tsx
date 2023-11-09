import { ImageField } from 'app/components/fields/ImageField'
import { makeStyles } from 'app/styles'

const messages = {
  label: 'Cover Photo'
}

const useStyles = makeStyles(() => ({
  root: {
    height: 96,
    width: '100%',
    borderRadius: 0,
    aspectRatio: undefined
  }
}))

const name = 'cover_photo'

export const CoverPhotoField = () => {
  const styles = useStyles()

  return (
    <ImageField
      name={name}
      label={messages.label}
      styles={{ imageContainer: styles.root }}
    />
  )
}
