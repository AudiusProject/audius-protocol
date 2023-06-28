import { ReleaseDateModalForm } from '../fields/ReleaseDateModalForm'
import { RemixModalForm } from '../fields/RemixModalForm'

import styles from './TrackModalArray.module.css'

export const TrackModalArray = () => {
  return (
    <div className={styles.root}>
      <ReleaseDateModalForm />
      <RemixModalForm />
    </div>
  )
}
