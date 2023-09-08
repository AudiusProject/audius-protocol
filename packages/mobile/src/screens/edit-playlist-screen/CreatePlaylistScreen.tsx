import { useCallback } from 'react'

import type { Collection } from '@audius/common'
import { CreatePlaylistSource, cacheCollectionsActions } from '@audius/common'
import type { FormikProps } from 'formik'
import { Formik } from 'formik'
import { Keyboard, TouchableWithoutFeedback, View } from 'react-native'
import { useDispatch } from 'react-redux'

import { FormScreen } from 'app/components/form-screen'
import { useNavigation } from 'app/hooks/useNavigation'
import { useToast } from 'app/hooks/useToast'

import { PlaylistDescriptionInput } from './LegacyPlaylistDescriptionInput'
import { PlaylistImageInput } from './LegacyPlaylistImageInput'
import { PlaylistNameInput } from './LegacyPlaylistNameInput'
const { createPlaylist } = cacheCollectionsActions

const messages = {
  title: 'Create Playlist',
  playlistCreatedToast: 'Playlist Created!'
}

type CreatePlaylistValues = Partial<Collection>

const CreatePlaylistForm = (props: FormikProps<CreatePlaylistValues>) => {
  const { handleSubmit, handleReset, errors } = props

  return (
    <FormScreen
      title={messages.title}
      onSubmit={handleSubmit}
      onReset={handleReset}
      errors={errors}
    >
      {/* Allow user to click outside of input to hide keyboard */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View>
          <PlaylistImageInput />
          <PlaylistNameInput />
          <PlaylistDescriptionInput />
        </View>
      </TouchableWithoutFeedback>
    </FormScreen>
  )
}

const initialValues: CreatePlaylistValues = {
  playlist_name: '',
  description: '',
  artwork: { url: '' }
}

const initialErrors = {
  playlist_name: 'Required'
}

export const CreatePlaylistScreen = () => {
  const { toast } = useToast()
  const navigation = useNavigation()

  const dispatch = useDispatch()
  const handleSubmit = useCallback(
    (values: CreatePlaylistValues) => {
      dispatch(createPlaylist(values, CreatePlaylistSource.FAVORITES_PAGE))
      toast({ content: messages.playlistCreatedToast })
      navigation.goBack()
    },
    [dispatch, toast, navigation]
  )

  return (
    <Formik
      initialValues={initialValues}
      initialErrors={initialErrors}
      onSubmit={handleSubmit}
      component={CreatePlaylistForm}
    />
  )
}
