import { useCallback } from 'react'

import {
  selectArtstsPageMessages as messages,
  selectArtistsSchema
} from '@audius/common'
import { addFollowArtists } from 'common/store/pages/signon/actions'
import { getGenres } from 'common/store/pages/signon/selectors'
import { Formik } from 'formik'
import { createMaterialCollapsibleTopTabNavigator } from 'react-native-collapsible-tab-view'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { Flex, Text } from '@audius/harmony-native'

import { ReadOnlyAccountHeader } from '../../components/AccountHeader'
import { Heading, PageFooter } from '../../components/layout'

import { SelectedGenresTabBar } from './SelectedGenresTabBar'
import { TopArtistsCardList } from './TopArtistsCardList'

const Tab = createMaterialCollapsibleTopTabNavigator()

type SelectArtistsValues = {
  selectedArtists: string[]
}

const initialValues: SelectArtistsValues = {
  selectedArtists: []
}

export const SelectArtistsScreen = () => {
  const genres = useSelector((state: any) => [
    'Featured',
    ...(getGenres(state) ?? [])
  ])
  const dispatch = useDispatch()

  const renderHeader = useCallback(
    () => (
      <Flex pointerEvents='none' backgroundColor='white'>
        <ReadOnlyAccountHeader />
        <Flex>
          <Heading
            heading={messages.header}
            description={messages.description}
            gap='s'
            ph='l'
            pv='unit10'
            pb='s'
          />
        </Flex>
      </Flex>
    ),
    []
  )

  const handleSubmit = useCallback(
    (values: SelectArtistsValues) => {
      const { selectedArtists } = values
      dispatch(
        addFollowArtists(selectedArtists.map((artist) => parseInt(artist)))
      )
    },
    [dispatch]
  )

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={toFormikValidationSchema(selectArtistsSchema)}
    >
      {({ dirty, isValid, values, errors }) => {
        const { selectedArtists } = values
        return (
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
              buttonProps={{ disabled: !dirty || !isValid }}
              postfix={
                <Text variant='body'>
                  {messages.selected} {selectedArtists.length || 0}/3
                </Text>
              }
            />
          </Flex>
        )
      }}
    </Formik>
  )
}
