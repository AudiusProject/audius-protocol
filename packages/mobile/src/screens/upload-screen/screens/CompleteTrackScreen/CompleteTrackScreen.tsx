import { useCallback } from 'react'

import type { UploadTrack } from '@audius/common'
import { useRoute } from '@react-navigation/native'
import { Formik } from 'formik'
import * as Yup from 'yup'

import { useNavigation } from 'app/hooks/useNavigation'

import type { FormValues, UploadParamList, UploadRouteProp } from '../../types'

import { CompleteTrackStack } from './CompleteTrackStack'

const CompleteTrackSchema = Yup.object().shape({
  title: Yup.string().required('Required'),
  artwork: Yup.object({
    url: Yup.string().nullable().required('Required')
  }),
  genre: Yup.string().required('Required'),
  description: Yup.string().max(1000).nullable()
})

export type CompleteTrackParams = UploadTrack

export const CompleteTrackScreen = () => {
  const { params } = useRoute<UploadRouteProp<'CompleteTrack'>>()
  const { metadata, file } = params
  const navigation = useNavigation<UploadParamList>()

  const initialValues: FormValues = {
    ...metadata,
    licenseType: {
      allowAttribution: false,
      commercialUse: false,
      derivativeWorks: false
    }
  }

  const handleSubmit = useCallback(
    (values: FormValues) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { licenseType, ...trackValues } = values
      navigation.push('UploadingTracks', {
        tracks: [
          { file, preview: null, metadata: { ...metadata, ...trackValues } }
        ]
      })
    },
    [navigation, file, metadata]
  )

  return (
    <Formik<FormValues>
      initialValues={initialValues}
      onSubmit={handleSubmit}
      component={CompleteTrackStack}
      validationSchema={CompleteTrackSchema}
    />
  )
}
