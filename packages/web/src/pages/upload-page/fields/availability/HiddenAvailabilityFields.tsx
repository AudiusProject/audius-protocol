import { Switch } from '@audius/stems'
import { useField } from 'formik'

import { Text } from 'components/typography'

import { FIELD_VISIBILITY } from '../AccessAndSaleField'

import styles from './HiddenAvailabilityFields.module.css'

const messages = {
  title: 'Visible Track Details',
  showGenre: 'Genre',
  showMood: 'Mood',
  showTags: 'Tags',
  showShareButton: 'Share Button',
  showPlayCount: 'Play Count'
}

export enum UnlistedTrackMetadataField {
  UNLISTED = 'unlisted',
  GENRE = 'genre',
  MOOD = 'mood',
  TAGS = 'tags',
  SHARE = 'share',
  PLAYS = 'plays'
}

export const defaultHiddenFields = {
  genre: true,
  mood: true,
  tags: true,
  share: false,
  play_count: false
  // REMIXES handled by a separate field
}

// The order of toggles in the modal
const unlistedTrackMetadataOrder = [
  UnlistedTrackMetadataField.GENRE,
  UnlistedTrackMetadataField.SHARE,
  UnlistedTrackMetadataField.MOOD,
  UnlistedTrackMetadataField.PLAYS,
  UnlistedTrackMetadataField.TAGS
]

export const HiddenAvailabilityFields = () => {
  return (
    <div className={styles.root}>
      <Text variant='title'>{messages.title}</Text>
      <div className={styles.switchContainer}>
        {unlistedTrackMetadataOrder.map((fieldName) => {
          return (
            <AvailabilityToggleField key={fieldName} fieldName={fieldName} />
          )
        })}
        {/* Dummy row for spacing consistency */}
        <div className={styles.switchRow}></div>
      </div>
    </div>
  )
}

const messageByFieldName = {
  [UnlistedTrackMetadataField.UNLISTED]: '',
  [UnlistedTrackMetadataField.GENRE]: messages.showGenre,
  [UnlistedTrackMetadataField.MOOD]: messages.showMood,
  [UnlistedTrackMetadataField.TAGS]: messages.showTags,
  [UnlistedTrackMetadataField.SHARE]: messages.showShareButton,
  [UnlistedTrackMetadataField.PLAYS]: messages.showPlayCount
}

type AvailabilityToggleFieldProps = {
  fieldName: UnlistedTrackMetadataField
}

const AvailabilityToggleField = (props: AvailabilityToggleFieldProps) => {
  const { fieldName } = props
  const [field] = useField({
    name: `${FIELD_VISIBILITY}.${fieldName}`,
    type: 'checkbox'
  })
  return (
    <div className={styles.switchRow}>
      <Switch {...field} />
      <Text className={styles.switchLabel}>
        {messageByFieldName[fieldName]}
      </Text>
    </div>
  )
}
