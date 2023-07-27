import { GENRES } from '@audius/common'

import { InputV2Variant } from 'components/data-entry/InputV2'
import {
  ArtworkField,
  DropdownField,
  TagField,
  TextAreaField,
  TextField
} from 'components/form-fields'
import { moodMap } from 'utils/Moods'

import styles from './TrackMetadataFields.module.css'

const MOODS = Object.keys(moodMap).map((k) => ({
  text: k,
  el: moodMap[k]
}))

const messages = {
  trackName: 'Track Name',
  genre: 'Pick a Genre',
  mood: 'Pick a Mood',
  description: 'Description'
}

export const TrackMetadataFields = () => {
  return (
    <div className={styles.basic}>
      <div className={styles.artwork}>
        <ArtworkField name='artwork' />
      </div>
      <div className={styles.fields}>
        <div className={styles.trackName}>
          <TextField
            name='title'
            variant={InputV2Variant.ELEVATED_PLACEHOLDER}
            label={messages.trackName}
            maxLength={64}
            required
          />
        </div>
        <div className={styles.categorization}>
          <DropdownField
            name='genre'
            aria-label={messages.genre}
            placeholder={messages.genre}
            mount='parent'
            menu={{ items: GENRES }}
            size='large'
          />
          <DropdownField
            name='mood'
            placeholder={messages.mood}
            mount='parent'
            menu={{ items: MOODS }}
            size='large'
          />
        </div>
        <div className={styles.tags}>
          <TagField name='tags' />
        </div>
        <div className={styles.description}>
          <TextAreaField
            name='description'
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
