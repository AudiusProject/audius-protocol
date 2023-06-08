import { useCallback, useState } from 'react'

import {
  Nullable,
  playerActions,
  playerSelectors,
  UploadType,
  removeNullable
} from '@audius/common'
import { Button, ButtonType, IconArrow } from '@audius/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import { useUnmount } from 'react-use'

import { Dropzone } from 'components/upload/Dropzone'
import InvalidFileType from 'components/upload/InvalidFileType'

import { processFiles } from '../store/utils/processFiles'

import styles from './SelectPage.module.css'
import TracksPreview from './TracksPreview'
import { TrackForUpload } from './types'
const { pause } = playerActions

const { getPlaying } = playerSelectors

type ErrorType = { reason: 'size' | 'type' } | null

type SelectPageProps = {
  tracks: TrackForUpload[]
  setTracks: (tracks: TrackForUpload[]) => void
  onContinue: () => void
}

export const SelectPageNew = (props: SelectPageProps) => {
  const { tracks, setTracks, onContinue } = props
  const dispatch = useDispatch()
  const playing = useSelector(getPlaying)

  const [uploadTrackError, setUploadTrackError] =
    useState<Nullable<ErrorType>>(null)
  // TODO: support upload types when directing to next page
  const [uploadType, setUploadType] = useState<UploadType>(
    UploadType.INDIVIDUAL_TRACK
  )
  const [previewIndex, setPreviewIndex] = useState(-1)
  const [preview, setPreview] = useState<Nullable<HTMLAudioElement>>()

  const onSelectTracks = useCallback(
    async (selectedFiles: File[]) => {
      const existing = new Set(
        tracks.map(
          ({ file }: { file: File }) => `${file.name}-${file.lastModified}`
        )
      )
      selectedFiles = selectedFiles.filter(({ name, lastModified }) => {
        const id = `${name}-${lastModified}`
        if (existing.has(id)) return false
        existing.add(id)
        return true
      })

      const processedFiles = processFiles(selectedFiles, (_name, reason) =>
        setUploadTrackError({ reason })
      )
      const processedTracks = (await Promise.all(processedFiles)).filter(
        removeNullable
      )
      if (processedTracks.length === processedFiles.length) {
        setUploadTrackError(null)
      }

      if (
        uploadType === UploadType.INDIVIDUAL_TRACK &&
        tracks.length + processedTracks.length > 1
      ) {
        setUploadType(UploadType.INDIVIDUAL_TRACKS)
      }

      setTracks([...tracks, ...processedTracks])
    },
    [setTracks, tracks, uploadType]
  )

  const onRemoveTrack = useCallback(
    (index: number) => {
      setTracks(tracks.filter((_, i) => i !== index))
      setUploadType(
        tracks.length === 2 ? UploadType.INDIVIDUAL_TRACK : uploadType
      )
    },
    [setTracks, tracks, uploadType]
  )

  const stopPreview = useCallback(() => {
    if (preview) {
      preview.pause()
      preview.currentTime = 0
    }
    setPreview(null)
    setPreviewIndex(-1)
  }, [preview])

  const playPreview = useCallback(
    (index: number) => {
      // Stop existing music if some is playing.
      if (playing) {
        dispatch(pause())
      }

      if (preview) stopPreview()
      const audio = tracks[index].preview
      audio.play()
      setPreview(audio)
      setPreviewIndex(index)
    },
    [dispatch, playing, preview, stopPreview, tracks]
  )

  useUnmount(() => {
    stopPreview()
  })

  const textAboveIcon = tracks.length > 0 ? 'More to Upload?' : undefined
  return (
    <div className={cn(styles.page)}>
      <div className={styles.select}>
        <div className={styles.dropzone}>
          <Dropzone
            textAboveIcon={textAboveIcon}
            onDropAccepted={onSelectTracks}
            onDropRejected={onSelectTracks}
          />
          {uploadTrackError ? (
            <InvalidFileType
              reason={uploadTrackError.reason}
              className={styles.invalidFileType}
            />
          ) : null}
        </div>
        <div
          className={cn(styles.uploaded, {
            [styles.hide]: tracks.length === 0
          })}
        >
          {tracks.length > 0 ? (
            <div>
              <TracksPreview
                tracks={tracks}
                uploadType={uploadType}
                previewIndex={previewIndex}
                onRemove={onRemoveTrack}
                setUploadType={setUploadType}
                playPreview={playPreview}
                stopPreview={stopPreview}
              />
              <div className={styles.count}>
                {tracks.length === 1
                  ? `${tracks.length} track uploaded`
                  : `${tracks.length} tracks uploaded`}
              </div>
              <div className={styles.continue}>
                <Button
                  type={ButtonType.PRIMARY_ALT}
                  text='Continue'
                  name='continue'
                  rightIcon={<IconArrow />}
                  onClick={onContinue}
                  textClassName={styles.continueButtonText}
                  className={styles.continueButton}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default SelectPageNew
