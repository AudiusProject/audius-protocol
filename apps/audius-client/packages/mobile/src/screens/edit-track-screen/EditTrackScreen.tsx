import { useCallback } from 'react'

import type { UploadTrack } from '@audius/common'
import { Formik } from 'formik'
import * as Yup from 'yup'

import { EditTrackNavigator } from './EditTrackNavigator'
import type { FormValues, EditTrackScreenProps } from './types'

const EditTrackSchema = Yup.object().shape({
  title: Yup.string().required('Required'),
  artwork: Yup.object({
    url: Yup.string()
  })
    .when('trackArtwork', {
      is: undefined,
      then: Yup.object().required('Required').nullable()
    })
    .nullable(),
  trackArtwork: Yup.string().nullable(),
  genre: Yup.string().required('Required'),
  description: Yup.string().max(1000).nullable()
})

export type EditTrackParams = UploadTrack

export const EditTrackScreen = (props: EditTrackScreenProps) => {
  const { initialValues: initialValuesProp, onSubmit, ...screenProps } = props

  const initialValues: FormValues = {
    ...initialValuesProp,
    licenseType: {
      allowAttribution: false,
      commercialUse: false,
      derivativeWorks: false
    }
  }

  const handleSubmit = useCallback(
    (values: FormValues) => {
      const {
        licenseType: ignoredLicenseType,
        trackArtwork: ignoredTrackArtwork,
        ...metadata
      } = values
      onSubmit(metadata)
    },
    [onSubmit]
  )

  return (
    <Formik<FormValues>
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={EditTrackSchema}
    >
      {(formikProps) => (
        <EditTrackNavigator {...formikProps} {...screenProps} />
      )}
    </Formik>
  )
}
