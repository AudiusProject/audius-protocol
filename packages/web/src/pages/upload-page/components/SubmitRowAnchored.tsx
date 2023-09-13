import { MutableRefObject } from 'react'

import { HarmonyButton, HarmonyButtonType, IconUpload } from '@audius/stems'
import { FormikProps } from 'formik'

import { TrackEditFormValues } from '../types'

const messages = {
  complete: 'Complete Upload'
}

type SubmitRowAnchoredProps = {
  formRef: MutableRefObject<FormikProps<TrackEditFormValues> | null>
}

export const SubmitRowAnchored = (props: SubmitRowAnchoredProps) => {
  const { formRef } = props

  return (
    <div>
      <HarmonyButton
        text={messages.complete}
        variant={HarmonyButtonType.PRIMARY}
        iconRight={IconUpload}
        onClick={formRef.current?.handleSubmit}
      />
    </div>
  )
}
