import { createContext, useCallback, useEffect, useState } from 'react'

import {
  UploadType,
  uploadActions,
  uploadConfirmationModalUIActions,
  uploadSelectors
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import Header from 'components/header/desktop/Header'
import Page from 'components/page/Page'

import { UploadFormScrollContext } from './UploadFormScrollContext'
import styles from './UploadPage.module.css'
import { EditPage } from './pages/EditPage'
import { FinishPage } from './pages/FinishPage'
import SelectPageNew from './pages/SelectPage'
import { UploadFormState } from './types'
import { UploadPreviewContextProvider } from './utils/uploadPreviewContext'

const { uploadTracks, undoResetState } = uploadActions
const { requestOpen: openUploadConfirmationModal } =
  uploadConfirmationModalUIActions
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

  // Pretty print json just for testing
  useEffect(() => {
    if (phase !== Phase.FINISH) return
    const stylizePreElements = function () {
      const preElements = document.getElementsByTagName('pre')
      for (let i = 0; i < preElements.length; ++i) {
        const preElement = preElements[i]
        preElement.className += 'prettyprint'
      }
    }

    const injectPrettifyScript = function () {
      const scriptElement = document.createElement('script')
      scriptElement.setAttribute(
        'src',
        'https://cdn.jsdelivr.net/gh/google/code-prettify@master/loader/run_prettify.js'
      )
      document.head.appendChild(scriptElement)
    }

    stylizePreElements()
    injectPrettifyScript()
  }, [phase])

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

  let page
  switch (phase) {
    case Phase.SELECT:
      page = (
        <SelectPageNew
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
              const hasPublicTracks =
                formState.tracks?.some(
                  (track) => !track.metadata.is_unlisted
                ) ?? true
              openUploadConfirmation(hasPublicTracks)
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

  const openUploadConfirmation = useCallback(
    (hasPublicTracks: boolean) => {
      dispatch(
        openUploadConfirmationModal({
          hasPublicTracks,
          confirmCallback: () => {
            setPhase(Phase.FINISH)
          }
        })
      )
    },
    [dispatch]
  )

  useEffect(() => {
    if (shouldResetState) {
      setFormState(initialFormState)
      setPhase(Phase.SELECT)
      dispatch(undoResetState())
    }
  }, [dispatch, shouldResetState])

  const handleUpload = useCallback(() => {
    if (!formState.tracks) return
    const { tracks } = formState
    const trackStems = tracks.map((track) => {
      // @ts-ignore - This has stems in it sometimes
      return track.metadata.stems ?? []
    }, [])

    // set download gate based on stream gate
    // this will be updated once the UI for download gated tracks is implemented
    const tracksToUpload = tracks.map((track) => {
      const isDownloadable = !!track.metadata.download?.is_downloadable
      const isDownloadGated = track.metadata.is_stream_gated
      const downloadConditions = track.metadata.stream_conditions
      return {
        ...track,
        metadata: {
          ...track.metadata,
          is_downloadable: isDownloadable,
          is_download_gated: isDownloadGated,
          download_conditions: downloadConditions
        }
      }
    })

    dispatch(
      uploadTracks(
        // @ts-ignore - This has artwork on it
        tracksToUpload,
        formState.uploadType === UploadType.ALBUM ||
          formState.uploadType === UploadType.PLAYLIST
          ? formState.metadata
          : undefined,
        formState.uploadType,
        trackStems
      )
    )
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
          primary={pageTitle}
          showBackButton={phase === Phase.EDIT}
          onClickBack={() => {
            setPhase(Phase.SELECT)
          }}
        />
      }
    >
      <UploadPreviewContextProvider>
        <UploadFormScrollContext.Provider value={scrollToTop}>
          {page}
        </UploadFormScrollContext.Provider>
      </UploadPreviewContextProvider>
    </Page>
  )
}
