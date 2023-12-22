import { useCallback } from 'react'

import { selectArtstsPageMessages as messages } from '@audius/common'
import { followArtists } from 'common/store/pages/signon/actions'
import { getFollowIds, getGenres } from 'common/store/pages/signon/selectors'
import { createMaterialCollapsibleTopTabNavigator } from 'react-native-collapsible-tab-view'
import { useSelector } from 'react-redux'

import { Flex, Text } from '@audius/harmony-native'

import { ReadOnlyAccountHeader } from '../../components/AccountHeader'
import { Heading, PageFooter } from '../../components/layout'

import { SelectedGenresTabBar } from './SelectedGenresTabBar'
import { TopArtistsCardList } from './TopArtistsCardList'
import { SelectArtistsPreviewContextProvider } from './selectArtistPreviewContext'

const Tab = createMaterialCollapsibleTopTabNavigator()

export const SelectArtistsScreen = () => {
  const genres = useSelector((state: any) => [
    'Featured',
    ...(getGenres(state) ?? [])
  ])
  const selectedArtists = useSelector(getFollowIds)
  const renderHeader = useCallback(
    () => (
      <Flex pointerEvents='none' backgroundColor='white'>
        <ReadOnlyAccountHeader />
        <Heading
          heading={messages.header}
          description={messages.description}
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
    // TODO
  }, [])

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
          onSubmit={handleSubmit}
          buttonProps={{ disabled: followArtists.length < 3 }}
          postfix={
            <Text variant='body'>
              {messages.selected} {selectedArtists.length || 0}/3
            </Text>
          }
        />
      </Flex>
    </SelectArtistsPreviewContextProvider>
  )
}
