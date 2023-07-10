import { ReleaseDateModalForm } from '../forms/ReleaseDateModalForm'
import { RemixModalForm } from '../forms/RemixModalForm'
import { SourceFilesModalForm } from '../forms/SourceFilesModalForm'
import { TrackAvailabilityModalForm } from '../forms/TrackAvailabilityModalForm'

import styles from './TrackModalArray.module.css'

export const TrackModalArray = () => {
  return (
    <div className={styles.root}>
      <ReleaseDateModalForm />
      <RemixModalForm />
      <SourceFilesModalForm />
      <TrackAvailabilityModalForm />
    </div>
  )
}
