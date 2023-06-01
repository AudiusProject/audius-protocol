import { useCallback, useState } from 'react'

import {
  CommonState,
  Nullable,
  TrackMetadata,
  UploadType,
  accountSelectors,
  playerActions,
  playerSelectors,
  removeNullable,
  uploadActions
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import Header from 'components/header/desktop/Header'
import Page from 'components/page/Page'

import styles from './UploadPage.module.css'
import SelectPage from './components/SelectPage'
import { processFiles } from './store/utils/processFiles'
const { toggleMultiTrackNotification } = uploadActions
const { pause } = playerActions

const { getAccountUser } = accountSelectors
const { getPlaying } = playerSelectors

type UploadPageProps = {
  uploadType: UploadType
}

type ErrorType = { reason: 'size' | 'type' } | null

type TrackForUpload = {
  file: File
  preview: HTMLAudioElement
  metadata: TrackMetadata
}

export const UploadPageNew = (props: UploadPageProps) => {
  const dispatch = useDispatch()
  const account = useSelector(getAccountUser)
  const openMultiTrackNotification = useSelector(
    // TODO: move to selectors.ts
    (state: CommonState) => state.upload.openMultiTrackNotification
  )
  const playing = useSelector(getPlaying)

  const [tracks, setTracks] = useState<TrackForUpload[]>([])
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
    [tracks, uploadType]
  )

  const onRemoveTrack = useCallback(
    (index: number) => {
      setTracks(tracks.filter((_, i) => i !== index))
      setUploadType(
        tracks.length === 2 ? UploadType.INDIVIDUAL_TRACK : uploadType
      )
    },
    [tracks, uploadType]
  )

  const onCloseMultiTrackNotification = useCallback(() => {
    dispatch(toggleMultiTrackNotification(false))
  }, [dispatch])

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

  return (
    <Page
      title='Upload'
      description='Upload and publish audio content to the Audius platform'
      contentClassName={styles.upload}
      header={<Header primary={'Upload'} />}
    >
      <SelectPage
        account={account}
        tracks={tracks}
        error={uploadTrackError}
        uploadType={uploadType}
        setUploadType={setUploadType}
        openMultiTrackNotification={openMultiTrackNotification}
        onCloseMultiTrackNotification={onCloseMultiTrackNotification}
        previewIndex={previewIndex}
        onSelect={onSelectTracks}
        onRemove={onRemoveTrack}
        playPreview={playPreview}
        stopPreview={stopPreview}
        // onContinue={() => this.changePage(Pages.EDIT)}
        onContinue={() => alert('submitted')}
      />
    </Page>
  )
}

export default UploadPageNew
