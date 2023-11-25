import { useCallback } from 'react'

import { GENRES, Genre, convertGenreLabelToValue } from '@audius/common'
import { Button, Flex, IconArrowRight, Text } from '@audius/harmony'
import { Form, Formik } from 'formik'
import { useDispatch } from 'react-redux'

import { setField } from 'common/store/pages/signon/actions'
import { SelectablePillField } from 'components/form-fields/SelectablePillField'
import { useMedia } from 'hooks/useMedia'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SIGN_UP_ARTISTS_PAGE } from 'utils/route'

import { AccountHeader } from '../components/AccountHeader'
import { ContinueFooter } from '../components/ContinueFooter'

const messages = {
  header: 'Select Your Genres',
  description: 'Start by picking some of your favorite genres.',
  continue: 'Continue'
}

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
    <Flex direction='column' h='100%' gap={isMobile ? '2xl' : '4xl'}>
      <AccountHeader mode='viewing' />
      <Flex flex={1} direction='column' gap={isMobile ? 'xl' : '2xl'}>
        <Flex direction='column' gap={isMobile ? 's' : 'l'} ph='l'>
          <Text
            variant='heading'
            size={isMobile ? 'm' : 'l'}
            color='heading'
            css={{ textAlign: isMobile ? 'left' : 'center' }}
            id='genre-header'
          >
            {messages.header}
          </Text>
          <Text
            variant='body'
            size={isMobile ? 'm' : 'l'}
            css={{ textAlign: isMobile ? 'left' : 'center' }}
          >
            {messages.description}
          </Text>
        </Flex>

        <Formik initialValues={initialValues} onSubmit={handleSubmit}>
          {({ values }) => (
            <Flex
              as={Form}
              alignItems={isMobile ? 'flex-start' : 'center'}
              direction='column'
              flex={1}
              justifyContent='space-between'
            >
              <Flex
                role='group'
                aria-labelledby='genre-header'
                css={{ maxWidth: 608 }}
                justifyContent={isMobile ? 'flex-start' : 'center'}
                alignItems='flex-start'
                gap='s'
                wrap='wrap'
                mb='4xl'
                ph='l'
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
              <ContinueFooter>
                <Button
                  type='submit'
                  iconRight={IconArrowRight}
                  disabled={values.genres.length === 0}
                >
                  {messages.continue}
                </Button>
              </ContinueFooter>
            </Flex>
          )}
        </Formik>
      </Flex>
    </Flex>
  )
}
