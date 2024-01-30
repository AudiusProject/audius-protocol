import { useCallback, useMemo } from 'react'

import {
  accountSelectors,
  CommonState,
  imageBlank as placeholderArt,
  ProgressState,
  ProgressStatus,
  uploadSelectors,
  UploadType
} from '@audius/common'
import { Name } from '@audius/common/models'
import {
  HarmonyPlainButton,
  IconArrow,
  IconError,
  IconUpload,
  IconValidationCheck,
  ProgressBar
} from '@audius/stems'
import { useDispatch, useSelector } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { Link } from 'components/link'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { Tile } from 'components/tile'
import { Text } from 'components/typography'
import { collectionPage, profilePage } from 'utils/route'

import { ShareBanner } from '../components/ShareBanner'
import { CollectionFormState, TrackFormState, TrackForUpload } from '../types'

import styles from './FinishPage.module.css'

const { getAccountUser } = accountSelectors
const { getCombinedUploadPercentage } = uploadSelectors

const messages = {
  uploadInProgress: 'Upload In Progress',
  uploadComplete: 'Upload Complete',
  uploadMore: 'Upload More',
  finishingUpload: 'Finalizing Upload',
  visitProfile: 'Visit Your Profile',
  visitTrack: 'Visit Track Page',
  visitAlbum: 'Visit Album Page',
  visitPlaylist: 'Visit Playlist Page'
}

const ProgressIndicator = (props: { status?: ProgressStatus }) => {
  const { status } = props

  switch (status) {
    case ProgressStatus.UPLOADING:
    case ProgressStatus.PROCESSING:
      return <LoadingSpinner className={styles.progressIndicator} />
    case ProgressStatus.COMPLETE:
      return <IconValidationCheck className={styles.progressIndicator} />
    case ProgressStatus.ERROR:
      return <IconError className={styles.progressIndicator} />
    default:
      return <div className={styles.emptyProgressIndicator} />
  }
}

type UploadTrackItemProps = {
  index: number
  displayIndex?: boolean
  displayArtwork?: boolean
  track: TrackForUpload
  trackProgress?: ProgressState
  hasError: boolean
}

const UploadTrackItem = (props: UploadTrackItemProps) => {
  const {
    index,
    hasError,
    track,
    trackProgress,
    displayIndex = false,
    displayArtwork = false,
    ...otherProps
  } = props
  // @ts-ignore - Artwork exists on track metadata object
  const artworkUrl = track.metadata.artwork.url

  return (
    <div className={styles.uploadTrackItem} {...otherProps}>
      <ProgressIndicator
        status={
          hasError
            ? ProgressStatus.ERROR
            : trackProgress?.audio?.loaded &&
              trackProgress?.audio?.total &&
              trackProgress.audio.loaded >= trackProgress.audio.total
            ? ProgressStatus.COMPLETE
            : trackProgress?.audio?.status
        }
      />
      {displayIndex ? <Text size='small'>{index + 1}</Text> : null}
      {displayArtwork ? (
        <DynamicImage
          wrapperClassName={styles.trackItemArtwork}
          image={artworkUrl || placeholderArt}
        />
      ) : null}
      <Text size='small'>{track.metadata.title}</Text>
    </div>
  )
}

type FinishPageProps = {
  formState: TrackFormState | CollectionFormState
  onContinue: () => void
}

export const FinishPage = (props: FinishPageProps) => {
  const { formState, onContinue } = props
  const { tracks, uploadType } = formState
  const upload = useSelector((state: CommonState) => state.upload)
  const user = useSelector(getAccountUser)
  const fullUploadPercent = useSelector(getCombinedUploadPercentage)
  const dispatch = useDispatch()

  const uploadComplete = useMemo(() => {
    if (!upload.uploadProgress || upload.uploading || !upload.success)
      return false

    return upload.uploadProgress.reduce((acc, progress) => {
      return (
        acc &&
        progress.art.status === ProgressStatus.COMPLETE &&
        progress.audio.status === ProgressStatus.COMPLETE
      )
    }, true)
  }, [upload])

  const handleUploadMoreClick = useCallback(() => {
    onContinue()
  }, [onContinue])

  const visitButtonText = useMemo(() => {
    switch (uploadType) {
      case UploadType.INDIVIDUAL_TRACK:
        return messages.visitTrack
      case UploadType.ALBUM:
        return messages.visitAlbum
      case UploadType.PLAYLIST:
        return messages.visitPlaylist
      default:
        if (!upload.tracks || upload.tracks.length > 1) {
          return messages.visitProfile
        } else {
          return messages.visitTrack
        }
    }
  }, [upload.tracks, uploadType])

  const visitButtonPath = useMemo(() => {
    switch (uploadType) {
      case UploadType.INDIVIDUAL_TRACK:
        return upload.tracks?.[0].metadata.permalink
      case UploadType.ALBUM:
      case UploadType.PLAYLIST:
        return collectionPage(
          user!.handle,
          upload.metadata?.playlist_name,
          upload.completionId,
          null,
          uploadType === UploadType.ALBUM
        )
      default:
        if (!upload.tracks || upload.tracks.length > 1) {
          return profilePage(user!.handle)
        } else {
          return upload.tracks?.[0].metadata.permalink
        }
    }
  }, [
    upload.completionId,
    upload.metadata?.playlist_name,
    upload.tracks,
    uploadType,
    user
  ])

  const dispatchVisitEvent = useCallback(() => {
    dispatch(make(Name.TRACK_UPLOAD_VIEW_TRACK_PAGE, { uploadType }))
  }, [dispatch, uploadType])

  const isUnlistedTrack =
    (upload.tracks &&
      upload.tracks.length === 1 &&
      upload.tracks[0].metadata.is_unlisted) ??
    false

  return (
    <div className={styles.page}>
      {uploadComplete ? (
        <ShareBanner
          uploadType={uploadType}
          isUnlistedTrack={isUnlistedTrack}
        />
      ) : null}
      <Tile className={styles.uploadProgress} elevation='mid'>
        <div className={styles.uploadHeader}>
          <div className={styles.headerInfo}>
            <Text id='upload-progress' variant='label' size='small'>
              {uploadComplete
                ? messages.uploadComplete
                : messages.uploadInProgress}
            </Text>
            <div className={styles.headerProgressInfo}>
              <Text variant='label' as='p' size='small'>
                {uploadComplete
                  ? '100%'
                  : fullUploadPercent === 100 && !uploadComplete
                  ? messages.finishingUpload
                  : `${fullUploadPercent}%`}
              </Text>
              <ProgressIndicator
                status={
                  upload.error
                    ? ProgressStatus.ERROR
                    : uploadComplete
                    ? ProgressStatus.COMPLETE
                    : ProgressStatus.UPLOADING
                }
              />
            </div>
          </div>
          {!uploadComplete ? (
            <ProgressBar
              aria-labelledby='upload-progress'
              sliderClassName={styles.uploadProgressBar}
              value={fullUploadPercent}
            />
          ) : null}
        </div>
        <div className={styles.uploadTrackList}>
          {tracks.map((track, idx) => {
            const trackProgress = upload.uploadProgress?.[idx]
            const trackError = upload.failedTrackIndices.find(
              (index) => index === idx
            )
            return (
              <UploadTrackItem
                key={track.metadata.track_id}
                track={track}
                displayIndex={tracks.length > 1}
                index={idx}
                trackProgress={trackProgress}
                displayArtwork={
                  uploadType === UploadType.INDIVIDUAL_TRACK ||
                  uploadType === UploadType.INDIVIDUAL_TRACKS
                }
                hasError={trackError !== undefined}
              />
            )
          })}
        </div>
        {uploadComplete && visitButtonPath ? (
          <div className={styles.uploadFooter}>
            <HarmonyPlainButton
              onClick={handleUploadMoreClick}
              text={messages.uploadMore}
              iconLeft={IconUpload}
            />
            <Link
              to={visitButtonPath}
              onClick={dispatchVisitEvent}
              className={styles.visitLink}
            >
              <HarmonyPlainButton
                text={visitButtonText}
                iconRight={IconArrow}
              />
            </Link>
          </div>
        ) : null}
      </Tile>
    </div>
  )
}
