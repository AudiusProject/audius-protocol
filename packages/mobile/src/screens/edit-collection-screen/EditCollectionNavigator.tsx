import type { EditCollectionValues } from '@audius/common/store'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { FormikProps } from 'formik'

import { DeletePlaylistConfirmationDrawer } from 'app/components/delete-playlist-confirmation-drawer'
import {
  priceAndAudienceScreenName,
  PriceAndAudienceScreen
} from 'app/components/edit/PriceAndAudienceField'
import { VisibilityScreen } from 'app/components/edit/VisibilityField'
import { useAppScreenOptions } from 'app/screens/app-screen/useAppScreenOptions'

import { EarlyReleaseConfirmationDrawer } from '../edit-track-screen/components/EarlyReleaseConfirmationDrawer'
import { EditAccessConfirmationDrawer } from '../edit-track-screen/components/EditAccessConfirmationDrawer'
import { HideConfirmationDrawer } from '../edit-track-screen/components/HideConfirmationDrawer'
import { PublishConfirmationDrawer } from '../edit-track-screen/components/PublishConfirmationDrawer'

import { AdvancedAlbumScreen } from './AdvancedAlbumScreen'
import { EditCollectionForm } from './EditCollectionForm'

const Stack = createNativeStackNavigator()

const screenOptionOverrides = { headerRight: () => null }

export const EditCollectionNavigator = (
  props: FormikProps<EditCollectionValues> & { playlistId: number }
) => {
  const screenOptions = useAppScreenOptions(screenOptionOverrides)

  return (
    <>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name='EditPlaylistForm'>
          {() => <EditCollectionForm {...props} />}
        </Stack.Screen>
        <Stack.Screen name='Visibility' component={VisibilityScreen} />
        <Stack.Screen
          name={priceAndAudienceScreenName}
          component={PriceAndAudienceScreen}
        />
        <Stack.Screen name='Advanced' component={AdvancedAlbumScreen} />
      </Stack.Navigator>
      <DeletePlaylistConfirmationDrawer />
      <EditAccessConfirmationDrawer />
      <EarlyReleaseConfirmationDrawer />
      <PublishConfirmationDrawer />
      <HideConfirmationDrawer />
    </>
  )
}
