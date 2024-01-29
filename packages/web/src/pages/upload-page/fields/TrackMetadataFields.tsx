import cn from 'classnames'
import { useField } from 'formik'

import { ArtworkField, TagField, TextAreaField } from 'components/form-fields'
import layoutStyles from 'components/layout/layout.module.css'

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
    <div className={cn(layoutStyles.col, layoutStyles.gap4)}>
      <div className={cn(styles.topRow, layoutStyles.row, layoutStyles.gap4)}>
        <ArtworkField name={getTrackFieldName(index, 'artwork')} size='small' />
        <div
          className={cn(
            styles.metadataFields,
            layoutStyles.col,
            layoutStyles.gap4
          )}
        >
          <TrackNameField name={getTrackFieldName(index, 'title')} />
          <div
            className={cn(
              styles.dropdownRow,
              layoutStyles.row,
              layoutStyles.gap2
            )}
          >
            <SelectGenreField name={getTrackFieldName(index, 'genre')} />
            <SelectMoodField name={getTrackFieldName(index, 'mood')} />
          </div>
          <div className={styles.tags}>
            <TagField name={getTrackFieldName(index, 'tags')} />
          </div>
        </div>
      </div>
      <div className={styles.description}>
        <TextAreaField
          name={getTrackFieldName(index, 'description')}
          aria-label='description'
          className={styles.textArea}
          placeholder={messages.description}
          maxLength={1000}
          showMaxLength
          grows
        />
      </div>
    </div>
  )
}
