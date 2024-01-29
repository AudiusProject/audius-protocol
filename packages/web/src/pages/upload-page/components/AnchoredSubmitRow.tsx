import { useContext } from 'react'

import { Button, IconCloudUpload } from '@audius/harmony'

import { UploadFormScrollContext } from '../UploadFormScrollContext'

import styles from './AnchoredSubmitRow.module.css'

const messages = {
  complete: 'Complete Upload'
}

export const AnchoredSubmitRow = () => {
  const scrollToTop = useContext(UploadFormScrollContext)
  return (
    <>
      <div className={styles.buttonRow}>
        <Button
          variant='primary'
          size='default'
          iconRight={IconCloudUpload}
          onClick={scrollToTop}
          type='submit'
        >
          {messages.complete}
        </Button>
      </div>
      <div className={styles.placeholder} />
    </>
  )
}
