import { useField } from 'formik'

import { ArtworkField, TagField, TextAreaField } from 'components/form-fields'

import { getTrackFieldName } from '../hooks'

import { SelectGenreField } from './SelectGenreField'
import { SelectMoodField } from './SelectMoodField'
import styles from './TrackMetadataFields.module.css'
import { TrackNameField } from './TrackNameField'

const messages = {
  description: 'Description'
}

export const TrackMetadataFields = () => {
  const [{ value: index }] = useField('trackMetadatasIndex')

  return (
    <div className={styles.basic}>
      <div className={styles.artwork}>
        <ArtworkField name={getTrackFieldName(index, 'artwork')} />
      </div>
      <div className={styles.fields}>
        <div className={styles.trackName}>
          <TrackNameField name={getTrackFieldName(index, 'title')} />
        </div>
        <div className={styles.categorization}>
          <SelectGenreField name={getTrackFieldName(index, 'genre')} />
          <SelectMoodField name={getTrackFieldName(index, 'mood')} />
        </div>
        <div className={styles.tags}>
          <TagField name={getTrackFieldName(index, 'tags')} />
        </div>
        <div className={styles.description}>
          <TextAreaField
            name={getTrackFieldName(index, 'description')}
            className={styles.textArea}
            placeholder={messages.description}
            maxLength={1000}
            showMaxLength
          />
        </div>
      </div>
    </div>
  )
}
