import styles from './CoverPhotoField.module.css'
import { ImageField } from './ImageField'

export const CoverPhotoField = () => {
  return <ImageField name='cover_photo' className={styles.root} />
}
