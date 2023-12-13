import { useCallback } from 'react'

import {
  GENRES,
  Genre,
  convertGenreLabelToValue,
  selectGenresPageMessages as messages,
  selectGenresSchema
} from '@audius/common'
import { Flex } from '@audius/harmony'
import { Form, Formik } from 'formik'
import { useDispatch } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { setField } from 'common/store/pages/signon/actions'
import { SelectablePillField } from 'components/form-fields/SelectablePillField'
import { useMedia } from 'hooks/useMedia'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SIGN_UP_ARTISTS_PAGE } from 'utils/route'

import { AccountHeader } from '../components/AccountHeader'
import { Heading, Page, PageFooter, ScrollView } from '../components/layout'

const genres = GENRES.map((genre) => ({
  value: genre,
  label: convertGenreLabelToValue(genre)
}))

type SelectGenreValues = { genres: Genre[] }

const initialValues: SelectGenreValues = {
  genres: []
}

export const SelectGenrePage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()

  const handleSubmit = useCallback(
    (values: SelectGenreValues) => {
      const { genres } = values
      dispatch(setField('genres', genres))
      navigate(SIGN_UP_ARTISTS_PAGE)
    },
    [dispatch, navigate]
  )

  const { isMobile } = useMedia()

  return (
    <ScrollView gap={isMobile ? '2xl' : '3xl'}>
      <AccountHeader mode='viewing' />
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validationSchema={toFormikValidationSchema(selectGenresSchema)}
      >
        {({ isValid, dirty }) => (
          <Page
            as={Form}
            centered
            css={{ paddingTop: 0 }}
            transition='horizontal'
          >
            <Heading
              heading={messages.header}
              description={messages.description}
              alignItems={!isMobile ? 'center' : undefined}
            />
            <Flex
              justifyContent={isMobile ? 'flex-start' : 'center'}
              alignItems='flex-start'
              gap='s'
              wrap='wrap'
            >
              {genres.map((genre) => {
                const { label, value } = genre
                return (
                  <SelectablePillField
                    key={label}
                    name='genres'
                    label={label}
                    value={value}
                    size='large'
                    type='checkbox'
                  />
                )
              })}
            </Flex>
            <PageFooter
              centered
              sticky
              buttonProps={{ disabled: !(dirty && isValid) }}
            />
          </Page>
        )}
      </Formik>
    </ScrollView>
  )
}
