import { useCallback, useContext, useEffect } from 'react'

import { IconDrag, IconTrash, Text, IconButton } from '@audius/harmony'
import { useField } from 'formik'

import { UploadPreviewContext } from 'components/edit-track/utils/uploadPreviewContext'
import { Tile } from 'components/tile'
import { CollectionTrackForUpload } from 'pages/upload-page/types'

import styles from './CollectionTrackField.module.css'
import { TrackNameField } from './TrackNameField'

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

  // Override is currently unavailable thru the UI but the code is still here. We will revisit this with a new expandable edit UI
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
        <IconButton
          size='m'
          color='subdued'
          icon={IconTrash}
          onClick={handleRemove}
          disabled={disableDelete}
          aria-label='Delete track'
        />
      </div>
    </Tile>
  )
}
