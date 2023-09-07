import { useCallback, useMemo } from 'react'

import {
  accountSelectors,
  CommonState,
  imageBlank as placeholderArt,
  Progress,
  ProgressStatus,
  uploadSelectors
} from '@audius/common'
import {
  HarmonyPlainButton,
  IconArrow,
  IconError,
  IconUpload,
  IconValidationCheck,
  ProgressBar
} from '@audius/stems'
import { push } from 'connected-react-router'
import { floor } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { Tile } from 'components/tile'
import { Text } from 'components/typography'
import { profilePage } from 'utils/route'

import { CollectionFormState, TrackFormState, TrackForUpload } from '../types'

import styles from './FinishPage.module.css'
import { ShareBannerNew } from './ShareBannerNew'

const { getAccountUser } = accountSelectors
const { getUploadPercentage } = uploadSelectors

const messages = {
  uploadInProgress: 'Upload In Progress',
  uploadComplete: 'Upload Complete',
  uploadMore: 'Upload More',
  visitProfile: 'Visit Your Profile'
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
  track: TrackForUpload
  trackProgress?: Progress
  hasError: boolean
}

const UploadTrackItem = (props: UploadTrackItemProps) => {
  const { index, hasError, track, trackProgress, displayIndex = false } = props
  // @ts-ignore - Artwork exists on track metadata object
  const artworkUrl = track.metadata.artwork.url

  return (
    <div className={styles.uploadTrackItem}>
      <ProgressIndicator
        status={
          hasError
            ? ProgressStatus.ERROR
            : trackProgress?.loaded === trackProgress?.total
            ? ProgressStatus.COMPLETE
            : trackProgress?.status
        }
      />
      {displayIndex ? <Text size='small'>{index + 1}</Text> : null}
      <DynamicImage
        wrapperClassName={styles.trackItemArtwork}
        image={artworkUrl || placeholderArt}
      />
      <Text size='small'>{track.metadata.title}</Text>
    </div>
  )
}

type FinishPageProps = {
  formState: TrackFormState | CollectionFormState
  onContinue: () => void
}

export const FinishPageNew = (props: FinishPageProps) => {
  const { formState, onContinue } = props
  const { tracks } = formState
  const accountUser = useSelector(getAccountUser)
  const upload = useSelector((state: CommonState) => state.upload)
  const user = useSelector(getAccountUser)
  const fullUploadPercent = useSelector(getUploadPercentage)
  const dispatch = useDispatch()

  const uploadComplete = useMemo(() => {
    if (!upload.uploadProgress) return false
    return (
      upload.success &&
      upload.uploadProgress.reduce((acc, progress) => {
        return acc && progress.status === ProgressStatus.COMPLETE
      }, true)
    )
  }, [upload])

  const handleUploadMoreClick = useCallback(() => {
    onContinue()
  }, [onContinue])

  const handleVisitProfileClick = useCallback(() => {
    if (user) {
      dispatch(push(profilePage(user.handle)))
    }
  }, [dispatch, user])

  return (
    <div className={styles.page}>
      {uploadComplete ? <ShareBannerNew user={accountUser!} /> : null}
      <Tile className={styles.uploadProgress} elevation='mid'>
        <div className={styles.uploadHeader}>
          <div className={styles.headerInfo}>
            <Text variant='label' size='small'>
              {uploadComplete
                ? messages.uploadComplete
                : messages.uploadInProgress}
            </Text>
            <div className={styles.headerProgressInfo}>
              <Text variant='label' size='small'>
                {fullUploadPercent === 100 && !uploadComplete
                  ? '99%'
                  : `${floor(fullUploadPercent)}%`}
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
                hasError={trackError !== undefined}
              />
            )
          })}
        </div>
        {uploadComplete ? (
          <div className={styles.uploadFooter}>
            <HarmonyPlainButton
              onClick={handleUploadMoreClick}
              text={messages.uploadMore}
              iconLeft={IconUpload}
            />
            <HarmonyPlainButton
              onClick={handleVisitProfileClick}
              text={messages.visitProfile}
              iconRight={IconArrow}
            />
          </div>
        ) : null}
      </Tile>
    </div>
  )
}
