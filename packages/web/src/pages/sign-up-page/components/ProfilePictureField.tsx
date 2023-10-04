import { ImageField } from './ImageField'
import styles from './ProfilePictureField.module.css'

export const ProfilePictureField = () => {
  return <ImageField name='profile_picture' className={styles.root} />
}
