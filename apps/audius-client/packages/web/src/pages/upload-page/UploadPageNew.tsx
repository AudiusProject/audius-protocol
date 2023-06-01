import { UploadType } from '@audius/common'

import Header from 'components/header/desktop/Header'
import Page from 'components/page/Page'

import styles from './UploadPage.module.css'

type UploadPageProps = {
  uploadType: UploadType
}

export const UploadPageNew = (props: UploadPageProps) => {
  return (
    <Page
      title='Upload'
      description='Upload and publish audio content to the Audius platform'
      contentClassName={styles.upload}
      header={<Header primary={'Upload'} />}
    >
      This is the new upload page
    </Page>
  )
}

export default UploadPageNew
