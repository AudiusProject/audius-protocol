import { useCallback } from 'react'

import { CreatePlaylistSource, cacheCollectionsActions } from '@audius/common'
import type { FormikProps } from 'formik'
import { Formik } from 'formik'
import { Keyboard, TouchableWithoutFeedback, View } from 'react-native'
import { useDispatch } from 'react-redux'
import { getTempPlaylistId } from 'utils/tempPlaylistId'

import { FormScreen } from 'app/components/form-screen'
import { useNavigation } from 'app/hooks/useNavigation'
import { useToast } from 'app/hooks/useToast'

import { PlaylistDescriptionInput } from './PlaylistDescriptionInput'
import { PlaylistImageInput } from './PlaylistImageInput'
import { PlaylistNameInput } from './PlaylistNameInput'
const { createPlaylist } = cacheCollectionsActions

const messages = {
  title: 'Create Playlist',
  playlistCreatedToast: 'Playlist Created!'
}

type PlaylistValues = {
  playlist_name: string
  description: string
  artwork: {
    url: string
    file?: {
      uri: string
      name: string
      type: string
    }
    source?: 'unsplash' | 'original'
  }
}

const CreatePlaylistForm = (props: FormikProps<PlaylistValues>) => {
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

const initialValues: PlaylistValues = {
  playlist_name: '',
  description: '',
  artwork: { url: '' }
}

const initialErrors = {
  playlist_name: 'Required'
}

export const CreatePlaylistScreen = () => {
  const { toast } = useToast()

  const dispatch = useDispatch()
  const navigation = useNavigation()
  const handleSubmit = useCallback(
    (values: PlaylistValues) => {
      const tempId = getTempPlaylistId()
      dispatch(
        createPlaylist(tempId, values, CreatePlaylistSource.FAVORITES_PAGE)
      )
      navigation.replace('Collection', { id: parseInt(tempId.toString(), 10) })
      toast({ content: messages.playlistCreatedToast })
    },
    [dispatch, navigation, toast]
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
