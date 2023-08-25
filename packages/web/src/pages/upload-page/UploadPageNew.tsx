import { useCallback, useEffect, useState } from 'react'

import {
  UploadType,
  uploadActions,
  uploadConfirmationModalUIActions
} from '@audius/common'
import { useDispatch } from 'react-redux'

import Header from 'components/header/desktop/Header'
import Page from 'components/page/Page'

import styles from './UploadPage.module.css'
import { FinishPageNew } from './components/FinishPageNew'
import SelectPageNew from './components/SelectPageNew'
import { EditPage } from './pages/EditPage'
import { UploadFormState } from './types'

const { uploadTracks } = uploadActions
const { requestOpen: openUploadConfirmationModal } =
  uploadConfirmationModalUIActions

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

export const UploadPageNew = () => {
  const dispatch = useDispatch()
  const [phase, setPhase] = useState(Phase.SELECT)
  const [formState, setFormState] = useState<UploadFormState>({
    uploadType: undefined,
    metadata: undefined,
    tracks: undefined
  })

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
      if (formState.uploadType) {
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
      if (formState.uploadType) {
        page = (
          <FinishPageNew
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

  const handleUpload = useCallback(() => {
    if (!formState.tracks) return
    const { tracks } = formState
    const trackStems = tracks.reduce((acc, track) => {
      // @ts-ignore - This has stems in it sometimes
      acc = [...acc, ...(track.metadata.stems ?? [])]
      return acc
    }, [])

    dispatch(
      uploadTracks(
        // @ts-ignore - This has artwork on it
        tracks,
        // NOTE: Need to add metadata for collections here for collection upload
        undefined,
        tracks.length > 1
          ? UploadType.INDIVIDUAL_TRACKS
          : UploadType.INDIVIDUAL_TRACK,
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
      header={<Header primary={pageTitle} />}
    >
      {page}
    </Page>
  )
}
