import { useCallback } from 'react'

import {
  GENRES,
  convertGenreLabelToValue,
  selectGenresPageMessages as messages,
  selectGenresSchema
} from '@audius/common'
import { setField } from 'common/store/pages/signon/actions'
import { Formik, useField } from 'formik'
import { ScrollView, View } from 'react-native'
import { useDispatch } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { Flex, SelectablePill } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

import { ReadOnlyAccountHeader } from '../components/AccountHeader'
import { Heading, Page, PageFooter, gutterSize } from '../components/layout'
import type { SignUpScreenParamList } from '../types'

const genres = GENRES.map((genre) => ({
  value: genre,
  label: convertGenreLabelToValue(genre)
}))

type SelectGenreValues = { genres: typeof GENRES }

const initialValues = { genres: [] }

const SelectGenreFieldArray = () => {
  const [, meta, helpers] = useField({ name: 'genres', type: 'checkbox' })
  const { value: values } = meta
  const { setValue } = helpers

  const handleChange = (value) => {
    const newValues = [...values]
    const valueIndex = values.indexOf(value)

    if (valueIndex > -1) {
      // Already checked
      newValues.splice(valueIndex, 1)
    } else {
      // Unchecked
      newValues.push(value)
    }
    setValue(newValues)
  }

  return (
    <ScrollView testID='genreScrollView'>
      <Flex gap='s' direction='row' wrap='wrap'>
        {genres.map((genre) => (
          <SelectablePill
            label={genre.label}
            key={genre.value}
            onPress={() => handleChange(genre.value)}
            isSelected={values.includes(genre.value)}
            size='large'
          />
        ))}
      </Flex>
    </ScrollView>
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
          <Page noGutter>
            <ReadOnlyAccountHeader />
            <Flex ph={gutterSize} gap='2xl'>
              <Heading
                heading={messages.header}
                description={messages.description}
              />
              <SelectGenreFieldArray />
            </Flex>
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
