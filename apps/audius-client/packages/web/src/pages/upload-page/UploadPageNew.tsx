import { useCallback, useEffect, useMemo, useState } from 'react'

import { uploadActions, UploadType } from '@audius/common'
import { useDispatch } from 'react-redux'

import Header from 'components/header/desktop/Header'
import Page from 'components/page/Page'

import styles from './UploadPage.module.css'
import { EditPageNew } from './components/EditPageNew'
import { FinishPageNew } from './components/FinishPageNew'
import SelectPageNew from './components/SelectPageNew'
import { TrackForUpload } from './components/types'

const { uploadTracks } = uploadActions

type UploadPageProps = {
  uploadType: UploadType
}

enum Phase {
  SELECT,
  EDIT,
  FINISH
}

const messages = {
  selectPageTitle: 'Upload Your Music',
  editSingleTrackPageTitle: 'Complete Your Track',
  editMultiTrackPageTitle: 'Complete Your Tracks',
  finishSingleTrackPageTitle: 'Uploading Your Track',
  finishMultiTrackPageTitle: 'Uploading Your Tracks'
}

export const UploadPageNew = (props: UploadPageProps) => {
  const dispatch = useDispatch()
  const [phase, setPhase] = useState(Phase.SELECT)
  const [tracks, setTracks] = useState<TrackForUpload[]>([])

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

  const pageTitle = useMemo(() => {
    switch (phase) {
      case Phase.EDIT:
        return tracks.length > 1
          ? messages.editMultiTrackPageTitle
          : messages.editSingleTrackPageTitle
      case Phase.FINISH:
        return tracks.length > 1
          ? messages.finishMultiTrackPageTitle
          : messages.finishSingleTrackPageTitle
      case Phase.SELECT:
      default:
        return messages.selectPageTitle
    }
  }, [phase, tracks])

  let page
  switch (phase) {
    case Phase.SELECT:
      page = (
        <SelectPageNew
          tracks={tracks}
          setTracks={setTracks}
          onContinue={() => {
            setPhase(Phase.EDIT)
          }}
        />
      )
      break
    case Phase.EDIT:
      page = (
        <EditPageNew
          tracks={tracks}
          setTracks={setTracks}
          onContinue={() => {
            setPhase(Phase.FINISH)
          }}
        />
      )
      break
    case Phase.FINISH:
      page = (
        <FinishPageNew
          tracks={tracks}
          onContinue={() => {
            setTracks([])
            setPhase(Phase.SELECT)
          }}
        />
      )
  }

  const handleUpload = useCallback(() => {
    console.log('Handling upload')
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
  }, [dispatch, tracks])

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
