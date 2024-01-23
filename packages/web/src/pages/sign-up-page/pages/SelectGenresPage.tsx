import { useCallback, useState } from 'react'

import {
  Genre,
  Name,
  selectGenresPageMessages as messages,
  selectGenresSchema,
  selectableGenres
} from '@audius/common'
import { Flex } from '@audius/harmony'
import { Form, Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { make } from 'common/store/analytics/actions'
import { setField } from 'common/store/pages/signon/actions'
import { getGenres } from 'common/store/pages/signon/selectors'
import { SelectablePillField } from 'components/form-fields/SelectablePillField'
import { useMedia } from 'hooks/useMedia'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SIGN_UP_ARTISTS_PAGE } from 'utils/route'

import { AccountHeader } from '../components/AccountHeader'
import { Heading, Page, PageFooter, ScrollView } from '../components/layout'

type SelectGenresValue = { genres: Genre[] }

export const SelectGenresPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()

  const [currentGenres, setCurrentGenres] = useState<Genre[]>([])
  const savedGenres = useSelector(getGenres)

  const initialValues: SelectGenresValue = {
    genres: (savedGenres as Genre[]) ?? []
  }
  const handleSubmit = useCallback(
    (values: SelectGenresValue) => {
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
        validateOnMount
      >
        {({ isValid }) => (
          <Page
            as={Form}
            centered
            css={{ paddingTop: 0 }}
            transition='horizontal'
          >
            <Flex
              direction='column'
              gap='2xl'
              mt={isMobile ? '2xl' : '3xl'}
              css={!isMobile ? { maxWidth: '641px' } : undefined}
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
                {selectableGenres.map((genre) => {
                  const { label, value } = genre
                  return (
                    <SelectablePillField
                      key={label}
                      name='genres'
                      label={label}
                      value={value}
                      size='large'
                      type='checkbox'
                      onClick={(e) => {
                        if ((e.target as HTMLInputElement).checked) {
                          dispatch(
                            make(Name.CREATE_ACCOUNT_SELECT_GENRE, {
                              genre: label,
                              selectedGenres: [...currentGenres, label]
                            })
                          )
                          setCurrentGenres([...currentGenres, label as Genre])
                        } else {
                          const newGenres = [...currentGenres]
                          const genreIndex = currentGenres.indexOf(
                            label as Genre
                          )
                          newGenres.splice(genreIndex, 1)
                          setCurrentGenres(newGenres)
                        }
                      }}
                    />
                  )
                })}
              </Flex>
            </Flex>
            <PageFooter centered sticky buttonProps={{ disabled: !isValid }} />
          </Page>
        )}
      </Formik>
    </ScrollView>
  )
}
