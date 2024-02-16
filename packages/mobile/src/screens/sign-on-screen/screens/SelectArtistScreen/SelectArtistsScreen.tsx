import { useCallback } from 'react'

import { selectArtistsPageMessages } from '@audius/common/messages'
import {
  addFollowArtists,
  finishSignUp,
  completeFollowArtists
} from 'audius-client/src/common/store/pages/signon/actions'
import { EditingStatus } from 'audius-client/src/common/store/pages/signon/types'
import {
  getFollowIds,
  getGenres,
  getStatus
} from 'common/store/pages/signon/selectors'
import { createMaterialCollapsibleTopTabNavigator } from 'react-native-collapsible-tab-view'
import { useDispatch, useSelector } from 'react-redux'

import { Flex, Text } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

import { ReadOnlyAccountHeader } from '../../components/AccountHeader'
import { Heading, PageFooter } from '../../components/layout'
import type { SignUpScreenParamList } from '../../types'

import { SelectedGenresTabBar } from './SelectedGenresTabBar'
import { TopArtistsCardList } from './TopArtistsCardList'
import { SelectArtistsPreviewContextProvider } from './selectArtistPreviewContext'

const Tab = createMaterialCollapsibleTopTabNavigator()

// Note for this screen we are not using Formik due to performance issues, and using redux instead.
export const SelectArtistsScreen = () => {
  const genres = useSelector((state: any) => [
    'Featured',
    ...(getGenres(state) ?? [])
  ])

  const selectedArtists = useSelector(getFollowIds)
  const dispatch = useDispatch()
  const navigation = useNavigation<SignUpScreenParamList>()

  const accountCreationStatus = useSelector(getStatus)

  const renderHeader = useCallback(
    () => (
      <Flex pointerEvents='none' backgroundColor='white'>
        <ReadOnlyAccountHeader />
        <Heading
          heading={selectArtistsPageMessages.header}
          description={selectArtistsPageMessages.description}
          gap='s'
          ph='l'
          pv='unit10'
          pb='s'
        />
      </Flex>
    ),
    []
  )

  const handleSubmit = useCallback(() => {
    // Follow selected artists
    dispatch(addFollowArtists(selectedArtists))
    dispatch(completeFollowArtists())
    // This call is what eventually triggers the RootScreen to redirect to the home page (via conditional rendering)
    dispatch(finishSignUp())
    if (accountCreationStatus === EditingStatus.LOADING) {
      navigation.navigate('AccountLoading')
    }
  }, [accountCreationStatus, dispatch, navigation, selectedArtists])

  return (
    <SelectArtistsPreviewContextProvider>
      <Flex flex={1}>
        <Tab.Navigator
          tabBar={SelectedGenresTabBar}
          collapsibleOptions={{
            renderHeader,
            headerHeight: 244,
            disableSnap: true
          }}
        >
          {genres.map((genre) => (
            <Tab.Screen
              key={genre}
              name={genre}
              component={TopArtistsCardList}
            />
          ))}
        </Tab.Navigator>
        <PageFooter
          buttonProps={{
            disabled: selectedArtists.length < 3,
            onPress: handleSubmit
          }}
          postfix={
            <Text variant='body'>
              {selectArtistsPageMessages.selected} {selectedArtists.length || 0}
              /3
            </Text>
          }
        />
      </Flex>
    </SelectArtistsPreviewContextProvider>
  )
}
