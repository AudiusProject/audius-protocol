import { useCallback } from 'react'

import {
  Genre,
  selectGenresPageMessages as messages,
  selectGenresSchema,
  selectableGenres
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

type SelectGenresValue = { genres: Genre[] }

const initialValues: SelectGenresValue = {
  genres: []
}

export const SelectGenresPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()

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
      >
        {({ isValid, dirty }) => (
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
                    />
                  )
                })}
              </Flex>
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
