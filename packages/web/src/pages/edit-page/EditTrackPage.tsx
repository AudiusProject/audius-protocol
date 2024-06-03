import { createContext, useEffect, useState } from 'react'

import Header from 'components/header/desktop/Header'
import Page from 'components/page/Page'

import { EditTrackForm } from 'components/edit-track/EditTrackForm'
import { useParams } from 'react-router'
import { useGetCurrentUserId, useGetTrackByPermalink } from '@audius/common/api'
import { TrackEditFormValues } from 'components/edit-track/types'
import {
  TrackMetadataForUpload,
  cacheTracksActions
} from '@audius/common/store'
import { DeleteConfirmationModal } from 'components/delete-confirmation'
import { useDispatch } from 'react-redux'
import {
  SquareSizes,
  Status,
  Track,
  TrackMetadata
} from '@audius/common/models'
import { useTrackCoverArt, useTrackCoverArt2 } from 'hooks/useTrackCoverArt'
import { Flex, Text } from '@audius/harmony'
import LoadingSpinnerFullPage from 'components/loading-spinner-full-page/LoadingSpinnerFullPage'

const { deleteTrack, editTrack } = cacheTracksActions

const messages = {
  title: 'Edit Your Track',
  deleteTrack: 'DELETE TRACK'
}

type UploadPageProps = {
  scrollToTop: () => void
}

export const UploadFormScrollContext = createContext(() => {})

export const EditTrackPage = (props: UploadPageProps) => {
  const { scrollToTop } = props
  //   const dispatch = useDispatch()
  //   const [formState, setFormState] = useState<UploadFormState>(initialFormState)
  const { handle, slug } = useParams<{ handle: string; slug: string }>()
  const dispatch = useDispatch()

  const { data: currentUserId } = useGetCurrentUserId({})
  const permalink = `/${handle}/${slug}`
  const { data: track, status: trackStatus } = useGetTrackByPermalink({
    permalink: permalink,
    currentUserId
  })
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

  const onSubmit = (formValues: TrackEditFormValues) => {
    const metadata = formValues.tracks[0].metadata
    dispatch(editTrack(metadata.track_id, metadata))
  }

  const onDeleteTrack = () => {
    if (!track) return
    dispatch(deleteTrack(track.track_id))
    setShowDeleteConfirmation(false)
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
      {/* // Debug: */}
      <Flex w='100%' direction='column' gap='xs' justifyContent='flex-start'>
        {/* <Text>{coverArtUrl}</Text> */}
      </Flex>
      {trackStatus !== Status.SUCCESS || !coverArtUrl ? (
        <LoadingSpinnerFullPage />
      ) : (
        <UploadFormScrollContext.Provider value={scrollToTop}>
          <EditTrackForm initialValues={initialValues} onSubmit={onSubmit} />
        </UploadFormScrollContext.Provider>
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
