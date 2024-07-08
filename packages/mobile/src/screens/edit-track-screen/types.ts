import type { TrackMetadataForUpload } from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'
import type { FormikProps } from 'formik'

import type { ScreenProps } from 'app/components/core'

export type FormValues = TrackMetadataForUpload & {
  licenseType: {
    allowAttribution: Nullable<boolean>
    commercialUse: Nullable<boolean>
    derivativeWorks: Nullable<boolean>
  }
  trackArtwork?: string
}

export type EditTrackScreenProps = {
  onSubmit: (values: TrackMetadataForUpload) => void
  initialValues: TrackMetadataForUpload & { trackArtwork?: string }
  doneText?: string
} & Partial<ScreenProps>

export type EditTrackFormProps = FormikProps<FormValues> &
  Partial<ScreenProps> & {
    doneText?: string
    isUpload?: boolean
  }

export type RemixOfField = Nullable<{ tracks: { parent_track_id }[] }>
