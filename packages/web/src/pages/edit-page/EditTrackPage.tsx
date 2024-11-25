import { createContext } from 'react'

import { useGetCurrentUserId, useGetTrackByPermalink } from '@audius/common/api'
import {
  SquareSizes,
  Status,
  Stem,
  StemUpload,
  Track,
  TrackMetadata
} from '@audius/common/models'
import {
  TrackMetadataForUpload,
  cacheTracksActions,
  cacheTracksSelectors,
  uploadActions,
  useReplaceTrackConfirmationModal,
  useReplaceTrackProgressModal
} from '@audius/common/store'
import { removeNullable } from '@audius/common/utils'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router'

import { useSelector } from 'common/hooks/useSelector'
import { EditTrackForm } from 'components/edit-track/EditTrackForm'
import { TrackEditFormValues } from 'components/edit-track/types'
import Header from 'components/header/desktop/Header'
import LoadingSpinnerFullPage from 'components/loading-spinner-full-page/LoadingSpinnerFullPage'
import Page from 'components/page/Page'
import { useIsUnauthorizedForHandleRedirect } from 'hooks/useManagedAccountNotAllowedRedirect'
import { useRequiresAccount } from 'hooks/useRequiresAccount'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'

const { editTrack } = cacheTracksActions
const { getStems } = cacheTracksSelectors
const { updateTrackAudio } = uploadActions

const messages = {
  title: 'Edit Your Track'
}

type EditPageProps = {
  scrollToTop: () => void
}

export const EditFormScrollContext = createContext(() => {})

export const EditTrackPage = (props: EditPageProps) => {
  const { scrollToTop } = props
  const { handle, slug } = useParams<{ handle: string; slug: string }>()
  const dispatch = useDispatch()
  useRequiresAccount()
  useIsUnauthorizedForHandleRedirect(handle)
  const { onOpen: openReplaceTrackConfirmation } =
    useReplaceTrackConfirmationModal()
  const { onOpen: openReplaceTrackProgress } = useReplaceTrackProgressModal()

  const { data: currentUserId } = useGetCurrentUserId({})
  const permalink = `/${handle}/${slug}`
  const { data: track, status: trackStatus } = useGetTrackByPermalink({
    permalink,
    currentUserId
  })

  const onSubmit = (formValues: TrackEditFormValues) => {
    const metadata = { ...formValues.trackMetadatas[0] }
    const replaceFile =
      'file' in formValues.tracks[0] ? formValues.tracks[0].file : null

    if (
      metadata.artwork &&
      'file' in metadata.artwork &&
      !metadata.artwork?.file
    ) {
      metadata.artwork = null
    }

    if (replaceFile) {
      openReplaceTrackConfirmation({
        confirmCallback: () => {
          dispatch(
            updateTrackAudio({
              trackId: metadata.track_id,
              file: replaceFile,
              metadata
            })
          )
          openReplaceTrackProgress()
        }
      })
    } else {
      dispatch(editTrack(metadata.track_id, metadata))
      dispatch(pushRoute(metadata.permalink))
    }
  }

  const coverArtUrl = useTrackCoverArt({
    trackId: track?.track_id,
    size: SquareSizes.SIZE_1000_BY_1000
  })

  const stemTracks = useSelector((state) => getStems(state, track?.track_id))
  const stemsAsUploads: StemUpload[] = stemTracks
    .map((stemTrack) => {
      const stem = (track as unknown as Track)?._stems?.find(
        (s: Stem) => s.track_id === stemTrack.track_id
      )
      if (!stem) return null
      return {
        metadata: stemTrack,
        category: stem.category,
        allowCategorySwitch: false,
        allowDelete: true
      }
    })
    .filter(removeNullable)

  const trackAsMetadataForUpload: TrackMetadataForUpload = {
    ...(track as TrackMetadata),
    mood: track?.mood || null,
    artwork: {
      url: coverArtUrl || ''
    },
    stems: stemsAsUploads
  }

  const initialValues: TrackEditFormValues = {
    tracks: [
      {
        metadata: trackAsMetadataForUpload
      }
    ],
    trackMetadatas: [trackAsMetadataForUpload],
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
          <EditTrackForm initialValues={initialValues} onSubmit={onSubmit} />
        </EditFormScrollContext.Provider>
      )}
    </Page>
  )
}
