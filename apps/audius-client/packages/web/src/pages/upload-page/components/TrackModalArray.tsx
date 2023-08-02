import { ReleaseDateField } from '../fields/ReleaseDateField'
import { AttributionModalForm } from '../forms/AttributionModalForm'
import { RemixModalForm } from '../forms/RemixModalForm'
import { SourceFilesModalForm } from '../forms/SourceFilesModalForm'
import { TrackAvailabilityModalForm } from '../forms/TrackAvailabilityModalForm'

import styles from './TrackModalArray.module.css'

export const TrackModalArray = () => {
  return (
    <div className={styles.root}>
      <ReleaseDateField />
      <RemixModalForm />
      <SourceFilesModalForm />
      <TrackAvailabilityModalForm />
      <AttributionModalForm />
    </div>
  )
}
