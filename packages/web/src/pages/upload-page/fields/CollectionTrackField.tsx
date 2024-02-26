import { useCallback, useContext, useEffect } from 'react'

import { IconDrag, IconTrash, Text, PlainButton } from '@audius/harmony'
import { useField } from 'formik'

import { TagField } from 'components/form-fields'
import { SwitchField } from 'components/form-fields/SwitchField'
import { Tile } from 'components/tile'

import { PreviewButton } from '../components/PreviewButton'
import { SelectGenreField } from '../fields/SelectGenreField'
import { SelectMoodField } from '../fields/SelectMoodField'
import { TrackNameField } from '../fields/TrackNameField'
import { CollectionTrackForUpload } from '../types'
import { UploadPreviewContext } from '../utils/uploadPreviewContext'

import styles from './CollectionTrackField.module.css'

const messages = {
  overrideLabel: 'Override details for this track',
  delete: 'Delete'
}

type CollectionTrackFieldProps = {
  index: number
  remove: (index: number) => void
  disableDelete: boolean
}

export const CollectionTrackField = (props: CollectionTrackFieldProps) => {
  const { disableDelete = false, index, remove } = props
  const { playingPreviewIndex, stopPreview } = useContext(UploadPreviewContext)
  const [{ value: track }] = useField<CollectionTrackForUpload>(
    `tracks.${index}`
  )

  const [{ value: metadata }, , { setValue }] = useField<
    CollectionTrackForUpload['metadata']
  >(`tracks.${index}.metadata`)

  const [{ value }] = useField('trackDetails')

  const { override } = track
  const isPreviewPlaying = playingPreviewIndex === index

  useEffect(() => {
    if (override) {
      setValue({ ...metadata, ...value })
    } else {
      setValue({ ...metadata, genre: '', mood: null, tags: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [override])

  const handleRemove = useCallback(() => {
    if (isPreviewPlaying) stopPreview()
    remove(index)
  }, [isPreviewPlaying, stopPreview, remove, index])

  return (
    <Tile className={styles.root} key={track.metadata.track_id} elevation='mid'>
      <div className={styles.trackNameRow}>
        <span className={styles.iconDrag}>
          <IconDrag color='default' />
        </span>
        <Text size='s'>{index + 1}</Text>
        <TrackNameField name={`tracks.${index}.metadata.title`} />
      </div>
      {override ? (
        <div className={styles.trackInformation}>
          <div className={styles.genreMood}>
            <SelectGenreField name={`tracks.${index}.metadata.genre`} />
            <SelectMoodField name={`tracks.${index}.metadata.mood`} />
          </div>
          <TagField name={`tracks.${index}.metadata.tags`} />
        </div>
      ) : null}
      <div className={styles.overrideRow}>
        <div className={styles.overrideSwitch}>
          <SwitchField name={`tracks.${index}.override`} />
          <Text>{messages.overrideLabel}</Text>
        </div>
        <div className={styles.actions}>
          <PreviewButton index={index} />
          <PlainButton
            variant='subdued'
            type='button'
            iconLeft={IconTrash}
            onClick={handleRemove}
            disabled={disableDelete}
          >
            {messages.delete}
          </PlainButton>
        </div>
      </div>
    </Tile>
  )
}
