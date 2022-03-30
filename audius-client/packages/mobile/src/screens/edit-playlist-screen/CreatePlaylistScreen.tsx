import { useCallback } from 'react'

import { CreatePlaylistSource } from 'audius-client/src/common/models/Analytics'
import { getUserHandle } from 'audius-client/src/common/store/account/selectors'
import { createPlaylist } from 'audius-client/src/common/store/cache/collections/actions'
import { playlistPage } from 'audius-client/src/utils/route'
import { Formik, FormikProps } from 'formik'

import { FormScreen } from 'app/components/form-screen'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { PlaylistDescriptionInput } from './PlaylistDescriptionInput'
import { PlaylistImageInput } from './PlaylistImageInput'
import { PlaylistNameInput } from './PlaylistNameInput'

const messages = {
  title: 'Create Playlist'
}

type PlaylistValues = {
  playlist_name: string
  description: string
  artwork: { url: string }
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
      <PlaylistImageInput />
      <PlaylistNameInput />
      <PlaylistDescriptionInput />
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
  const handle = useSelectorWeb(getUserHandle) ?? ''

  const dispatchWeb = useDispatchWeb()
  const navigation = useNavigation()
  const handleSubmit = useCallback(
    (values: PlaylistValues) => {
      console.log('this should only be called once????')
      const tempId = Date.now().toString()
      dispatchWeb(
        createPlaylist(tempId, values, CreatePlaylistSource.FAVORITES_PAGE)
      )
      navigation.replace({
        native: { screen: 'Collection', params: { id: parseInt(tempId, 10) } },
        web: { route: playlistPage(handle, values.playlist_name, tempId) }
      })
    },
    [dispatchWeb, navigation, handle]
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
