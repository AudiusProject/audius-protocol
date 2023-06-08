import { useState } from 'react'

import { UploadType } from '@audius/common'

import Header from 'components/header/desktop/Header'
import Page from 'components/page/Page'

import styles from './UploadPage.module.css'
import { EditPageNew } from './components/EditPageNew'
import SelectPageNew from './components/SelectPageNew'
import { TrackForUpload } from './components/types'

type UploadPageProps = {
  uploadType: UploadType
}

enum Phase {
  SELECT,
  EDIT,
  FINISH
}

export const UploadPageNew = (props: UploadPageProps) => {
  const [phase, setPhase] = useState(Phase.SELECT)
  const [tracks, setTracks] = useState<TrackForUpload[]>([])

  let page
  switch (phase) {
    case Phase.SELECT:
      page = (
        <SelectPageNew
          tracks={tracks}
          setTracks={setTracks}
          onContinue={() => setPhase(Phase.EDIT)}
        />
      )
      break
    case Phase.EDIT:
      page = (
        <EditPageNew
          tracks={tracks}
          setTracks={setTracks}
          onContinue={() => setPhase(Phase.FINISH)}
        />
      )
      break
    case Phase.FINISH:
      console.log(tracks)
      page = <>{JSON.stringify(tracks, null, 2)}</>
  }
  return (
    <Page
      title='Upload'
      description='Upload and publish audio content to the Audius platform'
      contentClassName={styles.upload}
      header={<Header primary={'Upload'} />}
    >
      {page}
    </Page>
  )
}

export default UploadPageNew
