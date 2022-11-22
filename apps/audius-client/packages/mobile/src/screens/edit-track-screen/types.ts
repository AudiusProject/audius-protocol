import type { ExtendedTrackMetadata } from '@audius/common'
import type { FormikProps } from 'formik'

import type { ScreenProps } from 'app/components/core'

export type FormValues = ExtendedTrackMetadata & {
  licenseType: {
    allowAttribution: boolean
    commercialUse: boolean
    derivativeWorks: boolean
  }
  trackArtwork?: string
}

export type EditTrackScreenProps = {
  onSubmit: (values: ExtendedTrackMetadata) => void
  initialValues: ExtendedTrackMetadata & { trackArtwork?: string }
} & Partial<ScreenProps>

export type EditTrackFormProps = FormikProps<FormValues> & Partial<ScreenProps>
