import Switch from '../switch/Switch'

import styles from './HiddenAvailability.module.css'
import { TrackMetadataState, UnlistedTrackMetadataField } from './types'

const messages = {
  showGenre: 'Show Genre',
  showMood: 'Show Mood',
  showTags: 'Show Tags',
  showShareButton: 'Show Share Button',
  showPlayCount: 'Show Play Count'
}

// The order of toggles in the modal
const unlistedTrackMetadataOrder = [
  UnlistedTrackMetadataField.GENRE,
  UnlistedTrackMetadataField.SHARE,
  UnlistedTrackMetadataField.MOOD,
  UnlistedTrackMetadataField.PLAYS,
  UnlistedTrackMetadataField.TAGS
]

const hiddenTrackMetadataMap = {
  [UnlistedTrackMetadataField.UNLISTED]: '',
  [UnlistedTrackMetadataField.GENRE]: messages.showGenre,
  [UnlistedTrackMetadataField.MOOD]: messages.showMood,
  [UnlistedTrackMetadataField.TAGS]: messages.showTags,
  [UnlistedTrackMetadataField.SHARE]: messages.showShareButton,
  [UnlistedTrackMetadataField.PLAYS]: messages.showPlayCount
}

const defaultHiddenFields = {
  unlisted: true,
  genre: true,
  mood: true,
  tags: true,
  plays: false,
  share: false
}

type HiddenAvailabilityProps = {
  state: TrackMetadataState
  toggleField: (field: UnlistedTrackMetadataField) => void
}

export const HiddenAvailability = ({
  state,
  toggleField
}: HiddenAvailabilityProps) => {
  return (
    <div className={styles.root}>
      {unlistedTrackMetadataOrder.map((field) => {
        return (
          <div className={styles.switchRow} key={field}>
            <span className={styles.switchLabel}>
              {hiddenTrackMetadataMap[field]}
            </span>
            <Switch
              key={field}
              isOn={state.unlisted ? state[field] : defaultHiddenFields[field]}
              handleToggle={() => toggleField(field)}
            />
          </div>
        )
      })}
      {/* Dummy row for spacing consistency */}
      <div className={styles.switchRow}></div>
    </div>
  )
}
