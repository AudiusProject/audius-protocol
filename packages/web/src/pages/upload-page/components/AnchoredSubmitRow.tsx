import { useContext } from 'react'

import {
  HarmonyButton,
  HarmonyButtonSize,
  HarmonyButtonType,
  IconUpload
} from '@audius/stems'

import { UploadFormScrollContext } from '../UploadPageNew'

import styles from './AnchoredSubmitRow.module.css'

const messages = {
  complete: 'Complete Upload'
}

export const AnchoredSubmitRow = () => {
  const scrollToTop = useContext(UploadFormScrollContext)
  return (
    <>
      <div className={styles.buttonRow}>
        <HarmonyButton
          text={messages.complete}
          variant={HarmonyButtonType.PRIMARY}
          size={HarmonyButtonSize.DEFAULT}
          iconRight={IconUpload}
          onClick={scrollToTop}
        />
      </div>
      <div className={styles.placeholder} />
    </>
  )
}
