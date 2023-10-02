import { ImageField } from 'app/components/fields/ImageField'
import { makeStyles } from 'app/styles'

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

  return <ImageField name={name} styles={{ imageContainer: styles.root }} />
}
