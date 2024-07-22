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
      </Stack.Navigator>
      <DeletePlaylistConfirmationDrawer />
    </>
  )
}
