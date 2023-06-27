import { ReleaseDateModalField } from '../fields/ReleaseDateModalField'
import { RemixModalField } from '../fields/RemixModalField'

import styles from './TrackModalArray.module.css'

export const TrackModalArray = () => {
  return (
    <div className={styles.root}>
      <ReleaseDateModalField />
      <RemixModalField />
    </div>
  )
}
