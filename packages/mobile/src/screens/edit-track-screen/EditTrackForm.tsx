import { useCallback } from 'react'

import type { TrackForUpload } from '@audius/common/store'
import {
  useEarlyReleaseConfirmationModal,
  useHideContentConfirmationModal,
  usePublishConfirmationModal
} from '@audius/common/store'
import { Keyboard } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useDispatch } from 'react-redux'

import {
  IconCaretLeft,
  IconCloudUpload,
  Button,
  Flex
} from '@audius/harmony-native'
import { Tile } from 'app/components/core'
import { InputErrorMessage } from 'app/components/core/InputErrorMessage'
import { PriceAndAudienceField } from 'app/components/edit/PriceAndAudienceField'
import { VisibilityField } from 'app/components/edit/VisibilityField'
import { PickArtworkField, TextField } from 'app/components/fields'
import { useNavigation } from 'app/hooks/useNavigation'
import { FormScreen } from 'app/screens/form-screen'
import { setVisibility } from 'app/store/drawers/slice'
import { makeStyles } from 'app/styles'

import { TopBarIconButton } from '../app-screen'

import { CancelEditTrackDrawer } from './components'
import {
  SelectGenreField,
  DescriptionField,
  SelectMoodField,
  TagField,
  SubmenuList,
  RemixSettingsField,
  AdvancedField
} from './fields'
import type { EditTrackFormProps } from './types'

const messages = {
  trackName: 'Track Name',
  trackNameError: 'Track Name Required',
  fixErrors: 'Fix Errors To Continue',
  cancel: 'Cancel'
}

const useStyles = makeStyles(({ spacing }) => ({
  backButton: {
    marginLeft: -6
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

export type EditTrackParams = TrackForUpload

export const EditTrackForm = (props: EditTrackFormProps) => {
  const {
    handleSubmit: handleSubmitProp,
    initialValues,
    values,
    isUpload,
    isSubmitting,
    errors,
    touched,
    dirty,
    title,
    doneText
  } = props
  const errorsKeys = Object.keys(errors)
  const hasErrors =
    errorsKeys.length > 0 && errorsKeys.every((errorKey) => touched[errorKey])
  const styles = useStyles()
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const initiallyHidden = initialValues.is_unlisted
  const isInitiallyScheduled = initialValues.is_scheduled_release
  const usersMayLoseAccess = !isUpload && !initiallyHidden && values.is_unlisted
  const isToBePublished = !isUpload && initiallyHidden && !values.is_unlisted

  const { onOpen: openHideContentConfirmation } =
    useHideContentConfirmationModal()
  const { onOpen: openEarlyReleaseConfirmation } =
    useEarlyReleaseConfirmationModal()
  const { onOpen: openPublishConfirmation } = usePublishConfirmationModal()

  const handlePressBack = useCallback(() => {
    if (!dirty) {
      navigation.goBack()
    } else {
      Keyboard.dismiss()
      dispatch(
        setVisibility({
          drawer: 'CancelEditTrack',
          visible: true
        })
      )
    }
  }, [dirty, navigation, dispatch])

  const handleSubmit = useCallback(() => {
    Keyboard.dismiss()

    if (usersMayLoseAccess) {
      openHideContentConfirmation({ confirmCallback: handleSubmitProp })
    } else if (isToBePublished && isInitiallyScheduled) {
      openEarlyReleaseConfirmation({
        contentType: 'track',
        confirmCallback: handleSubmitProp
      })
    } else if (isToBePublished) {
      openPublishConfirmation({
        contentType: 'track',
        confirmCallback: handleSubmitProp
      })
    } else {
      handleSubmitProp()
    }
  }, [
    usersMayLoseAccess,
    isToBePublished,
    isInitiallyScheduled,
    handleSubmitProp,
    openHideContentConfirmation,
    openEarlyReleaseConfirmation,
    openPublishConfirmation
  ])

  return (
    <>
      <FormScreen
        title={title}
        icon={IconCloudUpload}
        topbarLeft={
          <TopBarIconButton
            icon={IconCaretLeft}
            style={styles.backButton}
            onPress={handlePressBack}
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
            <Flex direction='row' gap='s'>
              <Button fullWidth variant='secondary' onPress={handlePressBack}>
                {messages.cancel}
              </Button>
              <Button
                variant='primary'
                fullWidth
                onPress={handleSubmit}
                disabled={isSubmitting || hasErrors}
              >
                {doneText}
              </Button>
            </Flex>
          </>
        }
      >
        <>
          <KeyboardAwareScrollView>
            <Tile style={styles.tile}>
              <PickArtworkField name='artwork' />
              <TextField name='title' label={messages.trackName} required />
              <SubmenuList>
                <SelectGenreField />
                <SelectMoodField />
              </SubmenuList>
              <TagField />
              <DescriptionField />
              <SubmenuList removeBottomDivider>
                <VisibilityField />
                <PriceAndAudienceField />
                <RemixSettingsField />
                <AdvancedField />
              </SubmenuList>
            </Tile>
          </KeyboardAwareScrollView>
        </>
      </FormScreen>
      <CancelEditTrackDrawer />
    </>
  )
}
