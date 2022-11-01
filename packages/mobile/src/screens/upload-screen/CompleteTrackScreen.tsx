import { useCallback } from 'react'

import type { FormikProps } from 'formik'
import { Formik } from 'formik'
import type { DocumentPickerResponse } from 'react-native-document-picker'
import * as Yup from 'yup'

import IconArrow from 'app/assets/images/iconArrow.svg'
import IconUpload from 'app/assets/images/iconUpload.svg'
import { Button, ScrollView, Tile } from 'app/components/core'
import { InputErrorMessage } from 'app/components/core/InputErrorMessage'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'
import { makeStyles } from 'app/styles'

import { UploadStackScreen } from './UploadStackScreen'
import { PickArtworkField, SelectGenreField, TextField } from './fields'
import type { TrackMetadata } from './types'

const messages = {
  screenTitle: 'Complete Track',
  name: 'Track Name',
  description: 'Description',
  continue: 'Continue',
  fixErrors: 'Fix Errors To Continue'
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  tile: {
    margin: spacing(3)
  },
  tileContent: {
    padding: spacing(4)
  }
}))

const CompleteTrackSchema = Yup.object().shape({
  name: Yup.string().required('Required'),
  artwork: Yup.object({
    url: Yup.string().nullable().required('Required')
  }),
  genre: Yup.string().required('Required'),
  description: Yup.string()
})

export type CompleteTrackParams = DocumentPickerResponse

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
            onPress={() => handleSubmit()}
            disabled={isSubmitting || hasErrors}
          />
        </>
      }
    >
      <ScrollView>
        <Tile styles={{ root: styles.tile, content: styles.tileContent }}>
          <PickArtworkField />
          <TextField name='name' label={messages.name} required />
          <TextField name='description' label={messages.description} />
          <SelectGenreField />
        </Tile>
      </ScrollView>
    </UploadStackScreen>
  )
}

export const CompleteTrackScreen = () => {
  const { params } = useRoute<'CompleteTrack'>()
  const { name } = params
  const navigation = useNavigation()

  const initialValues: TrackMetadata = {
    name,
    description: '',
    genre: null,
    artwork: { url: null }
  }

  const handleSubmit = useCallback(
    (values) => {
      navigation.push('UploadingTracks', { tracks: [values] })
    },
    [navigation]
  )

  return (
    <Formik<TrackMetadata>
      initialValues={initialValues}
      onSubmit={handleSubmit}
      component={CompleteTrackForm}
      validationSchema={CompleteTrackSchema}
    />
  )
}
