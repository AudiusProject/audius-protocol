import { useCallback } from 'react'

import { GENRES, convertGenreLabelToValue } from '@audius/common'
import { setField } from 'common/store/pages/signon/actions'
import {
  getHandleField,
  getNameField
} from 'common/store/pages/signon/selectors'
import { Formik } from 'formik'
import { Pressable, ScrollView, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Button, Text } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

import { Heading, Page, PageFooter } from '../components/layout'
import type { SignUpScreenParamList } from '../types'

const messages = {
  header: 'Select Your Genres',
  description: 'Start by picking some of your favorite genres.',
  continue: 'Continue'
}

const genres = GENRES.map((genre) => ({
  value: genre,
  label: convertGenreLabelToValue(genre)
}))

type SelectGenreValues = Record<string, boolean>

const initialValues = genres.reduce(
  (acc, genre) => ({
    ...acc,
    [genre.value]: false
  }),
  {} as SelectGenreValues
)

export const SelectGenreScreen = () => {
  const { value: displayName } = useSelector(getNameField)
  const { value: handle } = useSelector(getHandleField)
  const dispatch = useDispatch()
  const navigation = useNavigation<SignUpScreenParamList>()

  const handleSubmit = useCallback(
    (values: SelectGenreValues) => {
      const genres = Object.keys(values).filter((genre) => values[genre])
      dispatch(setField('genres', genres))
      navigation.navigate('SelectArtists')
    },
    [dispatch, navigation]
  )

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, setValues, handleSubmit: triggerSubmit, dirty, isValid }) => (
        <Page>
          <Heading
            heading={messages.header}
            description={messages.description}
          />
          <ScrollView testID='genreScrollView'>
            {genres.map((genre) => {
              const { label, value } = genre
              const checked = !!values[value]

              const handleChange = () => {
                setValues({
                  ...values,
                  [value]: !checked
                })
              }

              return (
                <Pressable
                  key={value}
                  testID={label}
                  accessibilityRole='checkbox'
                  accessibilityState={{ checked }}
                  accessibilityLiveRegion='polite'
                  onPress={handleChange}
                  style={{ backgroundColor: checked ? 'purple' : undefined }}
                >
                  <Text>{label}</Text>
                </Pressable>
              )
            })}
          </ScrollView>
          <PageFooter
            buttonProps={{ disabled: !(dirty && isValid) }}
            onSubmit={triggerSubmit}
          />
        </Page>
      )}
    </Formik>
  )
}
