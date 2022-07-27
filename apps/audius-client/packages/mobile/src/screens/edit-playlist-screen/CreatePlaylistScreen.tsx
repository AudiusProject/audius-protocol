import { useCallback } from 'react'

import { CreatePlaylistSource } from '@audius/common'
import { getUserHandle } from 'audius-client/src/common/store/account/selectors'
import { createPlaylist } from 'audius-client/src/common/store/cache/collections/actions'
import { playlistPage } from 'audius-client/src/utils/route'
import type { FormikProps } from 'formik'
import { Formik } from 'formik'

import { FormScreen } from 'app/components/form-screen'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useToast } from 'app/hooks/useToast'

import { PlaylistDescriptionInput } from './PlaylistDescriptionInput'
import { PlaylistImageInput } from './PlaylistImageInput'
import { PlaylistNameInput } from './PlaylistNameInput'

const messages = {
  title: 'Create Playlist',
  playlistCreatedToast: 'Playlist Created!'
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
      errors={errors}>
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
  const { toast } = useToast()

  const dispatchWeb = useDispatchWeb()
  const navigation = useNavigation()
  const handleSubmit = useCallback(
    (values: PlaylistValues) => {
      const tempId = Date.now().toString()
      dispatchWeb(
        createPlaylist(tempId, values, CreatePlaylistSource.FAVORITES_PAGE)
      )
      navigation.replace({
        native: { screen: 'Collection', params: { id: parseInt(tempId, 10) } },
        web: { route: playlistPage(handle, values.playlist_name, tempId) }
      })
      toast({ content: messages.playlistCreatedToast })
    },
    [dispatchWeb, navigation, handle, toast]
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
