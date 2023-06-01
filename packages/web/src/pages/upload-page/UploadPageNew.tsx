import { useState } from 'react'

import { UploadType } from '@audius/common'

import Header from 'components/header/desktop/Header'
import Page from 'components/page/Page'

import styles from './UploadPage.module.css'
import SelectPage from './components/SelectPage'

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

  let page
  switch (phase) {
    case Phase.SELECT:
      page = <SelectPage onContinue={() => setPhase(Phase.EDIT)} />
      break
    case Phase.EDIT:
    case Phase.FINISH:
      page = <>not yet implemented</>
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
