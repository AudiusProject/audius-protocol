import type { EditPlaylistValues } from '@audius/common/store'

import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { FormikProps } from 'formik'

import { DeletePlaylistConfirmationDrawer } from 'app/components/delete-playlist-confirmation-drawer'
import { useAppScreenOptions } from 'app/screens/app-screen/useAppScreenOptions'

import { EditPlaylistForm } from './EditPlaylistForm'

const Stack = createNativeStackNavigator()

const screenOptionOverrides = { headerRight: () => null }

export const EditPlaylistNavigator = (
  props: FormikProps<EditPlaylistValues> & { playlistId: number }
) => {
  const screenOptions = useAppScreenOptions(screenOptionOverrides)

  return (
    <>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name='EditPlaylistForm'>
          {() => <EditPlaylistForm {...props} />}
        </Stack.Screen>
      </Stack.Navigator>
      <DeletePlaylistConfirmationDrawer />
    </>
  )
}
