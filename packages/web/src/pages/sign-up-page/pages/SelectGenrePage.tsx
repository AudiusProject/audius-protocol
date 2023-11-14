import { ChangeEvent, useCallback } from 'react'

import { GENRES, convertGenreLabelToValue } from '@audius/common'
import {
  Button,
  Flex,
  IconArrowRight,
  SelectablePill,
  Text
} from '@audius/harmony'
import { Form, Formik } from 'formik'
import { useDispatch } from 'react-redux'

import { setField } from 'common/store/pages/signon/actions'
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

type SelectGenreValues = Record<string, boolean>

const initialValues = genres.reduce(
  (acc, genre) => ({
    ...acc,
    [genre.value]: false
  }),
  {} as SelectGenreValues
)

export const SelectGenrePage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()

  const handleSubmit = useCallback(
    (values: SelectGenreValues) => {
      const genres = Object.keys(values).filter((genre) => values[genre])
      dispatch(setField('genres', genres))
      navigate(SIGN_UP_ARTISTS_PAGE)
    },
    [dispatch, navigate]
  )

  const { isMobile } = useMedia()

  return (
    <Flex direction='column' gap={isMobile ? '2xl' : '4xl'}>
      <AccountHeader />
      <Flex direction='column' gap={isMobile ? 'xl' : '2xl'}>
        <Flex direction='column' gap={isMobile ? 's' : 'l'} ph='l'>
          <Text
            variant='heading'
            size={isMobile ? 'm' : 'l'}
            color='heading'
            css={{ textAlign: isMobile ? 'left' : 'center' }}
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
          {({ values, setValues }) => {
            const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
              setValues({ ...values, [e.target.name]: !values[e.target.name] })
            }

            return (
              <Flex
                as={Form}
                alignItems={isMobile ? 'flex-start' : 'center'}
                direction='column'
              >
                <Flex
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
                      <SelectablePill
                        key={value}
                        size='large'
                        type='checkbox'
                        label={label}
                        name={label}
                        isSelected={!!values[value]}
                        onChange={handleChange}
                      />
                    )
                  })}
                </Flex>
                <ContinueFooter>
                  <Button type='submit' iconRight={IconArrowRight}>
                    {messages.continue}
                  </Button>
                </ContinueFooter>
              </Flex>
            )
          }}
        </Formik>
      </Flex>
    </Flex>
  )
}
