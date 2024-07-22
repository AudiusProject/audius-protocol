import { useCallback } from 'react'

import type { EditCollectionValues } from '@audius/common/store'
import { deletePlaylistConfirmationModalUIActions } from '@audius/common/store'
import { useField, type FormikProps } from 'formik'
import { capitalize } from 'lodash'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import { IconClose, IconTrash } from '@audius/harmony-native'
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
import { AdvancedOptionsField } from '../edit-track-screen/fields'
import { FormScreen } from '../page-form-screen'

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
  const { playlistId, handleSubmit, handleReset } = props
  const styles = useStyles()
  const navigation = useNavigation()
  const dispatch = useDispatch()

  const [{ value: entityType }] = useField('entityType')
  const messages = getMessages(entityType)

  const openDeleteDrawer = useCallback(() => {
    dispatch(openDeletePlaylist({ playlistId }))
  }, [dispatch, playlistId])

  return (
    <FormScreen
      onSubmit={handleSubmit}
      onReset={handleReset}
      cancelText={messages.cancel}
      submitText={messages.save}
      goBackOnSubmit
      title={messages.screenTitle}
      topbarLeft={
        <TopBarIconButton icon={IconClose} onPress={navigation.goBack} />
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
            {entityType === 'album' ? <AdvancedOptionsField /> : null}
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
  )
}
