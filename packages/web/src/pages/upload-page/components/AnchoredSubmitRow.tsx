import { useContext } from 'react'

import {
  Button,
  ButtonSize,
  ButtonType,
  IconCloudUpload
} from '@audius/harmony'

import { UploadFormScrollContext } from '../UploadPage'

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
          text={messages.complete}
          variant={ButtonType.PRIMARY}
          size={ButtonSize.DEFAULT}
          iconRight={IconCloudUpload}
          onClick={scrollToTop}
          type='submit'
        />
      </div>
      <div className={styles.placeholder} />
    </>
  )
}
