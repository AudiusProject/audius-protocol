import {
  HarmonyButton,
  HarmonyButtonSize,
  HarmonyButtonType,
  IconUpload
} from '@audius/stems'

import styles from './SubmitRowAnchored.module.css'

const messages = {
  complete: 'Complete Upload'
}

export const SubmitRowAnchored = () => {
  return (
    <>
      <div className={styles.buttonRow}>
        <HarmonyButton
          text={messages.complete}
          variant={HarmonyButtonType.PRIMARY}
          size={HarmonyButtonSize.DEFAULT}
          iconRight={IconUpload}
        />
      </div>
      <div className={styles.placeholder} />
    </>
  )
}
