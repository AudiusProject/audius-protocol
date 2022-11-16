import type { UploadTrack } from '@audius/common'
import type { FormikProps } from 'formik'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import IconArrow from 'app/assets/images/iconArrow.svg'
import IconCaretRight from 'app/assets/images/iconCaretRight.svg'
import IconUpload from 'app/assets/images/iconUpload.svg'
import { Button, Tile } from 'app/components/core'
import { InputErrorMessage } from 'app/components/core/InputErrorMessage'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import { TopBarIconButton } from '../../../app-screen'
import { UploadStackScreen } from '../../components'
import {
  PickArtworkField,
  SelectGenreField,
  TextField,
  DescriptionField,
  SelectMoodField,
  TagField,
  SubmenuList,
  RemixSettingsField,
  AdvancedOptionsField
} from '../../fields'
import type { FormValues } from '../../types'

const messages = {
  screenTitle: 'Complete Track',
  trackName: 'Tcrack Name',
  trackNameError: 'Track Name Required',
  continue: 'Continue',
  fixErrors: 'Fix Errors To Continue'
}

const useStyles = makeStyles(({ spacing }) => ({
  backButton: {
    transform: [{ rotate: '180deg' }]
  },
  tile: {
    margin: spacing(3)
  },
  errorText: {
    alignSelf: 'center',
    marginTop: 0,
    marginBottom: spacing(4)
  }
}))

export type CompleteTrackParams = UploadTrack

export const CompleteTrackForm = (props: FormikProps<FormValues>) => {
  const { handleSubmit, isSubmitting, errors, touched } = props
  const errorsKeys = Object.keys(errors)
  const hasErrors =
    errorsKeys.length > 0 && errorsKeys.every((errorKey) => touched[errorKey])
  const styles = useStyles()
  const navigation = useNavigation()

  return (
    <UploadStackScreen
      title={messages.screenTitle}
      icon={IconUpload}
      topbarLeft={
        <TopBarIconButton
          icon={IconCaretRight}
          style={styles.backButton}
          onPress={navigation.goBack}
        />
      }
      bottomSection={
        <>
          {hasErrors ? (
            <InputErrorMessage
              message={messages.fixErrors}
              style={styles.errorText}
            />
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
      <KeyboardAwareScrollView>
        <Tile style={styles.tile}>
          <PickArtworkField />
          <TextField
            name='title'
            label={messages.trackName}
            required
            errorMessage={messages.trackNameError}
          />
          <SubmenuList>
            <SelectGenreField />
            <SelectMoodField />
          </SubmenuList>
          <TagField />
          <DescriptionField />
          <SubmenuList removeBottomDivider>
            <RemixSettingsField />
            <AdvancedOptionsField />
          </SubmenuList>
        </Tile>
      </KeyboardAwareScrollView>
    </UploadStackScreen>
  )
}
