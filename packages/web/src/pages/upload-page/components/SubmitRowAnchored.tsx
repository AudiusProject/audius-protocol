import { MutableRefObject } from 'react'

import {
  HarmonyButton,
  HarmonyButtonSize,
  HarmonyButtonType,
  IconUpload
} from '@audius/stems'
import { FormikProps } from 'formik'

import { TrackEditFormValues } from '../types'

import styles from './SubmitRowAnchored.module.css'

const messages = {
  complete: 'Complete Upload'
}

type SubmitRowAnchoredProps = {
  formRef: MutableRefObject<FormikProps<TrackEditFormValues> | null>
}

export const SubmitRowAnchored = (props: SubmitRowAnchoredProps) => {
  const { formRef } = props

  return (
    <div className={styles.root}>
      <HarmonyButton
        text={messages.complete}
        variant={HarmonyButtonType.PRIMARY}
        size={HarmonyButtonSize.DEFAULT}
        iconRight={IconUpload}
        onClick={formRef.current?.handleSubmit}
      />
    </div>
  )
}
