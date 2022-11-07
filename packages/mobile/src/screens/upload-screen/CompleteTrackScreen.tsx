import { useCallback } from 'react'

import type { TrackMetadata, UploadTrack } from '@audius/common'
import { useRoute } from '@react-navigation/native'
import type { FormikProps } from 'formik'
import { Formik } from 'formik'
import { KeyboardAvoidingView } from 'react-native'
import * as Yup from 'yup'

import IconArrow from 'app/assets/images/iconArrow.svg'
import IconUpload from 'app/assets/images/iconUpload.svg'
import { Button, ScrollView, Tile } from 'app/components/core'
import { InputErrorMessage } from 'app/components/core/InputErrorMessage'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import type { UploadParamList, UploadRouteProp } from './ParamList'
import { UploadStackScreen } from './UploadStackScreen'
import {
  PickArtworkField,
  SelectGenreField,
  TextField,
  DescriptionField
} from './fields'

const messages = {
  screenTitle: 'Complete Track',
  name: 'Track Name',
  continue: 'Continue',
  fixErrors: 'Fix Errors To Continue'
}

const useStyles = makeStyles(({ spacing }) => ({
  tile: {
    margin: spacing(3)
  },
  tileContent: {
    padding: spacing(4)
  }
}))

const CompleteTrackSchema = Yup.object().shape({
  title: Yup.string().required('Required'),
  artwork: Yup.object({
    url: Yup.string().nullable().required('Required')
  }),
  genre: Yup.string().required('Required'),
  description: Yup.string().nullable()
})

export type CompleteTrackParams = UploadTrack

const CompleteTrackForm = (props: FormikProps<TrackMetadata>) => {
  const { handleSubmit, isSubmitting, errors, touched } = props
  const errorsKeys = Object.keys(errors)
  const hasErrors =
    errorsKeys.length > 0 && errorsKeys.every((errorKey) => touched[errorKey])
  const styles = useStyles()

  return (
    <UploadStackScreen
      title={messages.screenTitle}
      icon={IconUpload}
      bottomSection={
        <>
          {hasErrors ? (
            <InputErrorMessage message={messages.fixErrors} />
          ) : null}
          <Button
            variant='primary'
            size='large'
            icon={IconArrow}
            fullWidth
            title={messages.continue}
            onPress={() => {
              handleSubmit()
            }}
            disabled={isSubmitting || hasErrors}
          />
        </>
      }
    >
      <ScrollView>
        <KeyboardAvoidingView behavior='position'>
          <Tile styles={{ root: styles.tile, content: styles.tileContent }}>
            <PickArtworkField />
            <TextField name='title' label={messages.name} required />
            <DescriptionField />
            <SelectGenreField />
          </Tile>
        </KeyboardAvoidingView>
      </ScrollView>
    </UploadStackScreen>
  )
}

export const CompleteTrackScreen = () => {
  const { params } = useRoute<UploadRouteProp<'CompleteTrack'>>()
  const { metadata, file } = params
  const navigation = useNavigation<UploadParamList>()

  const initialValues = metadata

  const handleSubmit = useCallback(
    (values) => {
      navigation.push('UploadingTracks', {
        tracks: [{ file, preview: null, metadata: { ...metadata, ...values } }]
      })
    },
    [navigation, file, metadata]
  )

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      component={CompleteTrackForm}
      validationSchema={CompleteTrackSchema}
    />
  )
}
