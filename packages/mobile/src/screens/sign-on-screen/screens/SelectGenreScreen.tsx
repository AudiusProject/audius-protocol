import { useCallback } from 'react'

import {
  GENRES,
  convertGenreLabelToValue,
  selectGenresPageMessages as messages,
  selectGenresSchema
} from '@audius/common'
import { setField } from 'common/store/pages/signon/actions'
import { Formik, useFormikContext } from 'formik'
import { Pressable, ScrollView, View } from 'react-native'
import { useDispatch } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { Text } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

import { AccountHeader } from '../components/AccountHeader'
import { Heading, Page, PageFooter } from '../components/layout'
import type { SignUpScreenParamList } from '../types'

const genres = GENRES.map((genre) => ({
  value: genre,
  label: convertGenreLabelToValue(genre)
}))

type SelectGenreValues = { genres: typeof GENRES }

const initialValues = { genres: [] }

const ClickableGenres = () => {
  const { values, setValues } = useFormikContext<SelectGenreValues>()

  return (
    <>
      {genres.map((genre) => {
        const { label, value } = genre
        const valueIndex = values.genres.indexOf(value)
        const checked = valueIndex > -1

        const handleChange = () => {
          const newValues = { genres: [...values.genres] }
          if (checked) {
            newValues.genres.splice(valueIndex, 1)
          } else {
            newValues.genres.push(value)
          }
          setValues(newValues)
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
    </>
  )
}

export const SelectGenreScreen = () => {
  const dispatch = useDispatch()
  const navigation = useNavigation<SignUpScreenParamList>()

  const handleSubmit = useCallback(
    (values: SelectGenreValues) => {
      const genres = values.genres
      dispatch(setField('genres', genres))
      navigation.navigate('SelectArtists')
    },
    [dispatch, navigation]
  )

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={toFormikValidationSchema(selectGenresSchema)}
      validateOnBlur
      validateOnChange
    >
      {({ handleSubmit: triggerSubmit, dirty, isValid }) => (
        <View>
          <AccountHeader />
          <Page offsetHeaderHeight>
            <Heading
              heading={messages.header}
              description={messages.description}
            />
            <ScrollView testID='genreScrollView'>
              <ClickableGenres />
            </ScrollView>
            <PageFooter
              buttonProps={{ disabled: !(dirty && isValid) }}
              onSubmit={triggerSubmit}
            />
          </Page>
        </View>
      )}
    </Formik>
  )
}
