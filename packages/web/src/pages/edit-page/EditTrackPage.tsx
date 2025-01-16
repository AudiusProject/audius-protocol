import { createContext } from 'react'

import { useTrackByPermalink, useUpdateTrack } from '@audius/common/api'
import {
  SquareSizes,
  Stem,
  StemUpload,
  Track,
  TrackMetadata
} from '@audius/common/models'
import {
  TrackMetadataForUpload,
  cacheTracksSelectors,
  uploadActions,
  useReplaceTrackConfirmationModal,
  useReplaceTrackProgressModal
} from '@audius/common/store'
import { removeNullable } from '@audius/common/utils'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router'

import { useSelector } from 'common/hooks/useSelector'
import { EditTrackForm } from 'components/edit-track/EditTrackForm'
import { TrackEditFormValues } from 'components/edit-track/types'
import { Header } from 'components/header/desktop/Header'
import LoadingSpinnerFullPage from 'components/loading-spinner-full-page/LoadingSpinnerFullPage'
import Page from 'components/page/Page'
import { useIsUnauthorizedForHandleRedirect } from 'hooks/useManagedAccountNotAllowedRedirect'
import { useRequiresAccount } from 'hooks/useRequiresAccount'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'
import { push } from 'utils/navigation'

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
  const { mutate: updateTrack } = useUpdateTrack()

  const permalink = `/${handle}/${slug}`
  const { data: track, isPending: isLoadingTrack } =
    useTrackByPermalink(permalink)

  const onSubmit = (formValues: TrackEditFormValues) => {
    const metadata = { ...formValues.trackMetadatas[0] }
    const replaceFile =
      'file' in formValues.tracks[0] ? formValues.tracks[0].file : null

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
      if (!track) return
      updateTrack({
        trackId: metadata.track_id,
        userId: track.owner_id,
        metadata,
        coverArtFile:
          metadata.artwork && 'file' in metadata.artwork
            ? (metadata.artwork.file as File)
            : undefined
      })
      dispatch(push(metadata.permalink))
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
      {isLoadingTrack ? (
        <LoadingSpinnerFullPage />
      ) : (
        <EditFormScrollContext.Provider value={scrollToTop}>
          <EditTrackForm initialValues={initialValues} onSubmit={onSubmit} />
        </EditFormScrollContext.Provider>
      )}
    </Page>
  )
}
