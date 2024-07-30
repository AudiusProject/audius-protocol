import { useCallback, useState } from 'react'

import type { EditCollectionValues } from '@audius/common/store'
import {
  deletePlaylistConfirmationModalUIActions,
  modalsActions
} from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'
import { useField, type FormikProps } from 'formik'
import { capitalize } from 'lodash'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import {
  Flex,
  IconArrowRight,
  IconClose,
  IconTrash,
  Button
} from '@audius/harmony-native'
import {
  Divider,
  TextButton,
  Tile,
  VirtualizedKeyboardAwareScrollView
} from 'app/components/core'
import { PriceAndAudienceField } from 'app/components/edit/PriceAndAudienceField'
import { VisibilityField } from 'app/components/edit/VisibilityField'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import { TopBarIconButton } from '../app-screen'
import { ConfirmPublishTrackDrawer } from '../edit-track-screen/components/ConfirmPublishDrawer'
import { FormScreen } from '../form-screen'

import { AdvancedAlbumField } from './AdvancedAlbumField'
import { CollectionDescriptionField } from './CollectionDescriptionField'
import { CollectionImageInput } from './CollectionImageInput'
import { CollectionNameField } from './CollectionNameField'
import { TrackListFieldArray } from './TrackListFieldArray'

const { requestOpen: openDeletePlaylist } =
  deletePlaylistConfirmationModalUIActions

const getMessages = (collectionType: 'album' | 'playlist') => ({
  screenTitle: `Edit ${capitalize(collectionType)}`,
  deletePlaylist: `Delete ${capitalize(collectionType)}`,
  cancel: 'Cancel',
  save: 'Save'
})

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing(6)
  },
  titleLabel: {
    fontFamily: typography.fontByWeight.heavy,
    fontSize: typography.fontSize.large,
    color: palette.neutralLight4,
    textTransform: 'uppercase'
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing(4)
  },
  bottomButton: {
    flexGrow: 1
  },
  tile: {
    margin: spacing(3),
    marginBottom: spacing(8)
  },
  header: { marginBottom: spacing(4) },
  deleteButtonRoot: {
    justifyContent: 'center',
    paddingVertical: spacing(4)
  },
  deleteButtonText: {
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.fontSize.small
  }
}))

export const EditCollectionForm = (
  props: FormikProps<EditCollectionValues> & { playlistId: number }
) => {
  const {
    playlistId,
    initialValues,
    values,
    handleSubmit: handleSubmitProp,
    handleReset
  } = props
  const styles = useStyles()
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const initiallyHidden = initialValues.is_private
  const isInitiallyScheduled = initialValues.is_scheduled_release
  const usersMayLoseAccess = !initiallyHidden && values.is_private
  const isToBePublished = initiallyHidden && !values.is_private
  const [confirmDrawerType, setConfirmDrawerType] =
    useState<Nullable<'release' | 'early_release' | 'hidden'>>(null)

  const [{ value: entityType }] = useField('entityType')
  const messages = getMessages(entityType)

  const openDeleteDrawer = useCallback(() => {
    dispatch(openDeletePlaylist({ playlistId }))
  }, [dispatch, playlistId])

  const submitAndGoBack = useCallback(() => {
    handleSubmitProp()
    navigation.goBack()
  }, [handleSubmitProp, navigation])

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
      submitAndGoBack()
    }
  }, [
    usersMayLoseAccess,
    isToBePublished,
    isInitiallyScheduled,
    dispatch,
    submitAndGoBack
  ])

  return (
    <>
      <FormScreen
        onSubmit={handleSubmit}
        title={messages.screenTitle}
        topbarLeft={
          <TopBarIconButton icon={IconClose} onPress={navigation.goBack} />
        }
        bottomSection={
          <Flex direction='row' gap='s'>
            <Button
              fullWidth
              variant='secondary'
              onPress={() => {
                handleReset()
                navigation.goBack()
              }}
            >
              {messages.cancel}
            </Button>
            <Button
              variant='primary'
              fullWidth
              onPress={() => {
                handleSubmit()
              }}
            >
              {messages.save}
            </Button>
          </Flex>
        }
      >
        <VirtualizedKeyboardAwareScrollView>
          <Tile style={styles.tile}>
            <View style={styles.header}>
              <CollectionImageInput />
              <CollectionNameField />
              <CollectionDescriptionField />
              <VisibilityField />
              {entityType === 'album' ? <PriceAndAudienceField /> : null}
              {entityType === 'album' ? <AdvancedAlbumField /> : null}
            </View>
            <Divider />
            <TrackListFieldArray />
            <TextButton
              variant='neutralLight4'
              title={messages.deletePlaylist}
              icon={IconTrash}
              iconPosition='left'
              onPress={openDeleteDrawer}
              styles={{
                root: styles.deleteButtonRoot,
                text: styles.deleteButtonText
              }}
            />
          </Tile>
        </VirtualizedKeyboardAwareScrollView>
      </FormScreen>
      {confirmDrawerType ? (
        <ConfirmPublishTrackDrawer
          type={confirmDrawerType}
          onConfirm={submitAndGoBack}
        />
      ) : null}
    </>
  )
}
