import { useCallback } from 'react'

import {
  CreatePlaylistSource,
  accountSelectors,
  cacheCollectionsActions
} from '@audius/common'
import { playlistPage } from 'audius-client/src/utils/route'
import type { FormikProps } from 'formik'
import { Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { getTempPlaylistId } from 'utils/tempPlaylistId'

import { FormScreen } from 'app/components/form-screen'
import { useNavigation } from 'app/hooks/useNavigation'
import { useToast } from 'app/hooks/useToast'

import { PlaylistDescriptionInput } from './PlaylistDescriptionInput'
import { PlaylistImageInput } from './PlaylistImageInput'
import { PlaylistNameInput } from './PlaylistNameInput'
const { createPlaylist } = cacheCollectionsActions
const { getUserHandle } = accountSelectors

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
  const handle = useSelector(getUserHandle) ?? ''
  const { toast } = useToast()

  const dispatch = useDispatch()
  const navigation = useNavigation()
  const handleSubmit = useCallback(
    (values: PlaylistValues) => {
      const tempId = getTempPlaylistId()
      dispatch(
        createPlaylist(tempId, values, CreatePlaylistSource.FAVORITES_PAGE)
      )
      navigation.replace({
        native: {
          screen: 'Collection',
          params: { id: parseInt(tempId.toString(), 10) }
        },
        web: { route: playlistPage(handle, values.playlist_name, tempId) }
      })
      toast({ content: messages.playlistCreatedToast })
    },
    [dispatch, navigation, handle, toast]
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
