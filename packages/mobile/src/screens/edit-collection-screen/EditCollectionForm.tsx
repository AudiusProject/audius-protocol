import { useCallback } from 'react'

import type { EditCollectionValues } from '@audius/common/store'
import {
  deletePlaylistConfirmationModalUIActions,
  useEarlyReleaseConfirmationModal,
  useHideContentConfirmationModal,
  usePublishConfirmationModal
} from '@audius/common/store'
import { useField, type FormikProps } from 'formik'
import { capitalize } from 'lodash'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import {
  Flex,
  IconClose,
  IconTrash,
  Button,
  PlainButton
} from '@audius/harmony-native'
import {
  Divider,
  Tile,
  VirtualizedKeyboardAwareScrollView
} from 'app/components/core'
import { PriceAndAudienceField } from 'app/components/edit/PriceAndAudienceField'
import { VisibilityField } from 'app/components/edit/VisibilityField'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import { TopBarIconButton } from '../app-screen'
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

  const [{ value: entityType }] = useField('entityType')
  const messages = getMessages(entityType)

  const openDeleteDrawer = useCallback(() => {
    dispatch(openDeletePlaylist({ playlistId }))
  }, [dispatch, playlistId])

  const { onOpen: openHideContentConfirmation } =
    useHideContentConfirmationModal()
  const { onOpen: openEarlyReleaseConfirmation } =
    useEarlyReleaseConfirmationModal()
  const { onOpen: openPublishConfirmation } = usePublishConfirmationModal()

  const handleSubmit = useCallback(() => {
    if (usersMayLoseAccess) {
      openHideContentConfirmation({ confirmCallback: handleSubmitProp })
    } else if (
      isToBePublished &&
      isInitiallyScheduled &&
      entityType === 'album'
    ) {
      openEarlyReleaseConfirmation({
        contentType: 'album',
        confirmCallback: handleSubmitProp
      })
    } else if (isToBePublished) {
      openPublishConfirmation({
        contentType: entityType === 'album' ? 'album' : 'playlist',
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
    openPublishConfirmation,
    entityType
  ])

  const handleCancel = useCallback(() => {
    handleReset()
    navigation.goBack()
  }, [handleReset, navigation])

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
            <Button fullWidth variant='secondary' onPress={handleCancel}>
              {messages.cancel}
            </Button>
            <Button variant='primary' fullWidth onPress={handleSubmit}>
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
            <PlainButton
              variant='subdued'
              iconLeft={IconTrash}
              style={styles.deleteButtonRoot}
              onPress={openDeleteDrawer}
            >
              {messages.deletePlaylist}
            </PlainButton>
          </Tile>
        </VirtualizedKeyboardAwareScrollView>
      </FormScreen>
    </>
  )
}
