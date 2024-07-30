import { useCallback, useState } from 'react'

import { FeatureFlags } from '@audius/common/services'
import type { TrackForUpload } from '@audius/common/store'
import { modalsActions } from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'
import { Keyboard } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useDispatch } from 'react-redux'

import {
  IconArrowRight,
  IconCaretLeft,
  IconCloudUpload,
  Button
} from '@audius/harmony-native'
import { Tile } from 'app/components/core'
import { InputErrorMessage } from 'app/components/core/InputErrorMessage'
import { PriceAndAudienceField } from 'app/components/edit/PriceAndAudienceField'
import { VisibilityField } from 'app/components/edit/VisibilityField'
import { PickArtworkField, TextField } from 'app/components/fields'
import { useNavigation } from 'app/hooks/useNavigation'
import { useOneTimeDrawer } from 'app/hooks/useOneTimeDrawer'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { FormScreen } from 'app/screens/form-screen'
import { setVisibility } from 'app/store/drawers/slice'
import { makeStyles } from 'app/styles'

import { TopBarIconButton } from '../app-screen'

import { CancelEditTrackDrawer } from './components'
import { ConfirmPublishDrawer } from './components/ConfirmPublishDrawer'
import {
  SelectGenreField,
  DescriptionField,
  SelectMoodField,
  TagField,
  SubmenuList,
  RemixSettingsField,
  ReleaseDateField,
  AdvancedField
} from './fields'
import type { EditTrackFormProps } from './types'

const messages = {
  trackName: 'Track Name',
  trackNameError: 'Track Name Required',
  fixErrors: 'Fix Errors To Continue'
}

const GATED_CONTENT_UPLOAD_PROMPT_DRAWER_SEEN_KEY =
  'gated_content_upload_prompt_drawer_seen'

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
  const [confirmDrawerType, setConfirmDrawerType] =
    useState<Nullable<'release' | 'early_release' | 'hidden'>>(null)

  useOneTimeDrawer({
    key: GATED_CONTENT_UPLOAD_PROMPT_DRAWER_SEEN_KEY,
    name: 'GatedContentUploadPrompt'
  })

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
    const showConfirmDrawer = usersMayLoseAccess || isToBePublished
    if (showConfirmDrawer) {
      if (usersMayLoseAccess) {
        setConfirmDrawerType('hidden')
      } else if (isInitiallyScheduled) {
        setConfirmDrawerType('early_release')
      } else {
        setConfirmDrawerType('release')
      }
      dispatch(
        modalsActions.setVisibility({
          modal: 'EditAccessConfirmation',
          visible: true
        })
      )
    } else {
      handleSubmitProp()
    }
  }, [
    usersMayLoseAccess,
    isToBePublished,
    dispatch,
    isInitiallyScheduled,
    handleSubmitProp
  ])

  const { isEnabled: isHiddenPaidScheduledEnabled } = useFeatureFlag(
    FeatureFlags.HIDDEN_PAID_SCHEDULED
  )

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
            <Button
              variant='primary'
              iconRight={IconArrowRight}
              fullWidth
              onPress={() => {
                handleSubmit()
              }}
              disabled={isSubmitting || hasErrors}
            >
              {doneText}
            </Button>
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
                {isHiddenPaidScheduledEnabled ? (
                  <VisibilityField />
                ) : (
                  <ReleaseDateField />
                )}
                <PriceAndAudienceField />
                <RemixSettingsField />
                <AdvancedField />
              </SubmenuList>
            </Tile>
          </KeyboardAwareScrollView>
        </>
      </FormScreen>
      <CancelEditTrackDrawer />
      {!isUpload && confirmDrawerType ? (
        <ConfirmPublishDrawer
          type={confirmDrawerType}
          onConfirm={handleSubmitProp}
        />
      ) : null}
    </>
  )
}
