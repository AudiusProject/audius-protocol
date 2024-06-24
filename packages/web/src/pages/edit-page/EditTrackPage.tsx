import { createContext, useState } from 'react'

import { useGetCurrentUserId, useGetTrackByPermalink } from '@audius/common/api'
import { SquareSizes, Status, TrackMetadata } from '@audius/common/models'
import {
  TrackMetadataForUpload,
  cacheTracksActions
} from '@audius/common/store'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router'

import { DeleteConfirmationModal } from 'components/delete-confirmation'
import { EditTrackForm } from 'components/edit-track/EditTrackForm'
import { TrackEditFormValues } from 'components/edit-track/types'
import Header from 'components/header/desktop/Header'
import LoadingSpinnerFullPage from 'components/loading-spinner-full-page/LoadingSpinnerFullPage'
import Page from 'components/page/Page'
import { useTrackCoverArt2 } from 'hooks/useTrackCoverArt'
import { Button } from '@audius/harmony'
import { HOME_PAGE, PROFILE_PAGE } from 'utils/route'

const { deleteTrack, editTrack } = cacheTracksActions

const messages = {
  title: 'Edit Your Track',
  deleteTrack: 'DELETE TRACK'
}

type EditPageProps = {
  scrollToTop: () => void
}

export const EditFormScrollContext = createContext(() => {})

// This component is in development, only used behind the EDIT_TRACK_REDESIGN feature flag
export const EditTrackPage = (props: EditPageProps) => {
  const { scrollToTop } = props
  //   const dispatch = useDispatch()
  //   const [formState, setFormState] = useState<UploadFormState>(initialFormState)
  const { handle, slug } = useParams<{ handle: string; slug: string }>()
  const dispatch = useDispatch()

  const { data: currentUserId } = useGetCurrentUserId({})
  const permalink = `/${handle}/${slug}`
  const { data: track, status: trackStatus } = useGetTrackByPermalink({
    permalink,
    currentUserId
  })
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

  const onSubmit = (formValues: TrackEditFormValues) => {
    const metadata = { ...formValues.trackMetadatas[0] }
    if (!metadata.artwork?.file) {
      metadata.artwork = null
    }
    dispatch(editTrack(metadata.track_id, metadata))
    dispatch(pushRoute(metadata.permalink))
  }

  const onDeleteTrack = () => {
    if (!track) return
    dispatch(deleteTrack(track.track_id))
    setShowDeleteConfirmation(false)
    dispatch(pushRoute(`/${track.user.handle}`))
  }

  const coverArtUrl = useTrackCoverArt2(
    track?.track_id,
    SquareSizes.SIZE_1000_BY_1000
  )

  const trackAsMetadataForUpload: TrackMetadataForUpload = {
    ...(track as TrackMetadata),
    artwork: {
      url: coverArtUrl || ''
    }
    // TODO: Add stems
  }

  const initialValues: TrackEditFormValues = {
    tracks: [
      {
        metadata: trackAsMetadataForUpload
      }
    ],
    trackMetadatas: [
      {
        ...trackAsMetadataForUpload,
        licenseType: {
          allowAttribution: false,
          commercialUse: false,
          derivativeWorks: false
        },
        remix_of: null
      }
    ],
    trackMetadatasIndex: 0
  }

  return (
    <Page
      title={messages.title}
      header={<Header primary={messages.title} showBackButton />}
    >
      {trackStatus !== Status.SUCCESS || !coverArtUrl ? (
        <LoadingSpinnerFullPage />
      ) : (
        <EditFormScrollContext.Provider value={scrollToTop}>
          <EditTrackForm
            initialValues={initialValues}
            onSubmit={onSubmit}
            onDeleteTrack={() => setShowDeleteConfirmation(true)}
          />
        </EditFormScrollContext.Provider>
      )}
      <DeleteConfirmationModal
        title={messages.deleteTrack}
        entity='Track'
        visible={showDeleteConfirmation}
        onDelete={onDeleteTrack}
        onCancel={() => setShowDeleteConfirmation(false)}
      />
    </Page>
  )
}
