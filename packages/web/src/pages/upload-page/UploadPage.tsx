import { useCallback, useEffect, useState } from 'react'

import {
  uploadActions,
  uploadSelectors,
  UploadType,
  useUploadConfirmationModal
} from '@audius/common/store'
import { IconCloudUpload } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

import { Header } from 'components/header/desktop/Header'
import Page from 'components/page/Page'
import { EditFormScrollContext } from 'pages/edit-page/EditTrackPage'

import styles from './UploadPage.module.css'
import { EditPage } from './pages/EditPage'
import { FinishPage } from './pages/FinishPage'
import SelectPage from './pages/SelectPage'
import { UploadFormState } from './types'

const { uploadTracks, undoResetState } = uploadActions
const { getShouldReset } = uploadSelectors

const messages = {
  selectPageTitle: 'Upload Your Music',
  editPageTitle: 'Complete Your ',
  finishPageTitle: 'Uploading Your '
}

enum Phase {
  SELECT,
  EDIT,
  FINISH
}

const uploadTypeStringMap: Record<UploadType, string> = {
  [UploadType.INDIVIDUAL_TRACK]: 'Track',
  [UploadType.INDIVIDUAL_TRACKS]: 'Tracks',
  [UploadType.ALBUM]: 'Album',
  [UploadType.PLAYLIST]: 'Playlist'
}

const initialFormState = {
  uploadType: undefined,
  metadata: undefined,
  tracks: undefined
}

type UploadPageProps = {
  scrollToTop: () => void
}

export const UploadPage = (props: UploadPageProps) => {
  const { scrollToTop } = props
  const dispatch = useDispatch()
  const [phase, setPhase] = useState(Phase.SELECT)
  const [formState, setFormState] = useState<UploadFormState>(initialFormState)
  const shouldResetState = useSelector(getShouldReset)

  const { tracks, uploadType } = formState

  const pageTitleUploadType =
    !uploadType ||
    (uploadType === UploadType.INDIVIDUAL_TRACKS && tracks?.length === 1)
      ? UploadType.INDIVIDUAL_TRACK
      : uploadType

  let pageTitle = messages.selectPageTitle
  switch (phase) {
    case Phase.EDIT:
      pageTitle = `${messages.editPageTitle}${uploadTypeStringMap[pageTitleUploadType]}`
      break
    case Phase.FINISH:
      pageTitle = `${messages.finishPageTitle}${uploadTypeStringMap[pageTitleUploadType]}`
      break
    case Phase.SELECT:
    default:
      pageTitle = messages.selectPageTitle
  }

  const { onOpen: openUploadConfirmationModal } = useUploadConfirmationModal()

  const openUploadConfirmation = useCallback(
    (hasPublicTracks: boolean) => {
      openUploadConfirmationModal({
        hasPublicTracks,
        confirmCallback: () => {
          setPhase(Phase.FINISH)
        }
      })
    },
    [openUploadConfirmationModal]
  )

  let page
  switch (phase) {
    case Phase.SELECT:
      page = (
        <SelectPage
          formState={formState}
          onContinue={(formState: UploadFormState) => {
            setFormState(formState)
            setPhase(Phase.EDIT)
          }}
        />
      )
      break
    case Phase.EDIT:
      if (formState.uploadType !== undefined) {
        page = (
          <EditPage
            formState={formState}
            onContinue={(formState: UploadFormState) => {
              setFormState(formState)
              const isPrivateCollection =
                'metadata' in formState && formState.metadata?.is_private
              const hasPublicTracks =
                formState.tracks?.some(
                  (track) => !track.metadata.is_unlisted
                ) ?? true
              openUploadConfirmation(hasPublicTracks && !isPrivateCollection)
            }}
          />
        )
      }
      break
    case Phase.FINISH:
      if (formState.uploadType !== undefined) {
        page = (
          <FinishPage
            formState={formState}
            onContinue={() => {
              setFormState({
                tracks: undefined,
                uploadType: undefined,
                metadata: undefined
              })
              setPhase(Phase.SELECT)
            }}
          />
        )
      }
  }

  useEffect(() => {
    if (shouldResetState) {
      setFormState(initialFormState)
      setPhase(Phase.SELECT)
      dispatch(undoResetState())
    }
  }, [dispatch, shouldResetState])

  const handleUpload = useCallback(() => {
    if (!formState.tracks) return
    dispatch(uploadTracks(formState))
  }, [dispatch, formState])

  useEffect(() => {
    if (phase === Phase.FINISH) handleUpload()
  }, [handleUpload, phase])

  return (
    <Page
      title='Upload'
      description='Upload and publish audio content to the Audius platform'
      contentClassName={styles.upload}
      header={
        <Header
          icon={IconCloudUpload}
          primary={pageTitle}
          showBackButton={phase === Phase.EDIT}
          onClickBack={() => {
            setPhase(Phase.SELECT)
          }}
        />
      }
    >
      <EditFormScrollContext.Provider value={scrollToTop}>
        {page}
      </EditFormScrollContext.Provider>
    </Page>
  )
}
