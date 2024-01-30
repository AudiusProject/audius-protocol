import { memo, useCallback, useEffect, useState } from 'react'

import { selectGenresSchema, selectableGenres } from '@audius/common'
import { selectGenresPageMessages } from '@audius/common/messages'
import type { GENRES } from '@audius/common/utils'
import { setField } from 'common/store/pages/signon/actions'
import { Formik, useField } from 'formik'
import { ScrollView } from 'react-native'
import { useDispatch } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { Box, Flex, SelectablePill } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

import { ReadOnlyAccountHeader } from '../components/AccountHeader'
import { Heading, Page, PageFooter, gutterSize } from '../components/layout'
import type { SignUpScreenParamList } from '../types'

type Genre = (typeof GENRES)[number]
type SelectGenresValue = { genres: typeof GENRES }

const initialValues: SelectGenresValue = { genres: [] }

/* Memoized SelectablePill to fix a performance issue.
 * The code below is arranged so that the pills don't need to re-render,
 * And the memoization here is just forcing it to never re-render. */
const MemoSelectablePill = memo(SelectablePill, () => true)

const SelectGenresFieldArray = () => {
  // Storing values as state alongside Formik purely because setState provides access to the previous values
  const [formValues, setFormValues] = useState<SelectGenresValue['genres']>(
    initialValues.genres
  )
  const [, , { setValue }] = useField('genres')

  // Update formik state to match our React state
  useEffect(() => {
    setValue(formValues)
  }, [formValues, setValue])

  // memoized handle press just handles the React state change
  const handlePress = useCallback((genreValue: Genre) => {
    setFormValues((prevValues) => {
      const newValues = [...prevValues]
      const valueIndex = newValues.indexOf(genreValue)
      if (valueIndex > -1) {
        newValues.splice(valueIndex, 1)
      } else {
        newValues.push(genreValue)
      }
      return newValues
    })
  }, [])

  return (
    <ScrollView testID='genreScrollView'>
      <Flex gap='s' direction='row' wrap='wrap'>
        {selectableGenres.map((genre) => (
          <MemoSelectablePill
            label={genre.label}
            onPress={() => {
              handlePress(genre.value)
            }}
            size='large'
            key={genre.value}
          />
        ))}
      </Flex>
      {/* TODO improved sticky footer and header */}
      <Box h={80} />
    </ScrollView>
  )
}

export const SelectGenresScreen = () => {
  const dispatch = useDispatch()
  const navigation = useNavigation<SignUpScreenParamList>()

  const handleSubmit = useCallback(
    (values: SelectGenresValue) => {
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
      validateOnBlur
      validateOnChange
      validationSchema={toFormikValidationSchema(selectGenresSchema)}
    >
      <Page noGutter>
        <ReadOnlyAccountHeader />
        <Flex ph={gutterSize} gap='2xl' flex={1}>
          <Heading
            heading={selectGenresPageMessages.header}
            description={selectGenresPageMessages.description}
          />
          <SelectGenresFieldArray />
        </Flex>
        <PageFooter />
      </Page>
    </Formik>
  )
}
