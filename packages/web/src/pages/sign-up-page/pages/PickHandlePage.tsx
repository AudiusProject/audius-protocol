import { useCallback, useEffect, useRef } from 'react'

import { Box, Button, Flex, Text } from '@audius/harmony'
import { Form, Formik, FormikProps, useFormikContext } from 'formik'
import { debounce } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidate } from 'zod-formik-adapter'

import { setValueField } from 'common/store/pages/signon/actions'
import { getHandleField } from 'common/store/pages/signon/selectors'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import TwitterLogin from 'react-twitter-auth'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { SIGN_UP_FINISH_PROFILE_PAGE } from 'utils/route'
import {
  errorMessages as handleErrorMessages,
  handleSchema
} from '../utils/handleSchema'
import styles from './PickHandlePage.module.css'

const messages = {
  pickYourHandle: 'Pick Your Handle',
  outOf: 'of',
  handleDescription:
    'This is how others find and tag you. It is totally unique to you & cannot be changed later.',
  handle: 'Handle',
  continue: 'Continue',
  linkToClaim: 'Link to claim.',
  ...handleErrorMessages
}

type PickHandleValues = {
  handle: string
}

const HandleField = () => {
  const { values, validateForm, errors, touched } =
    useFormikContext<PickHandleValues>()
  const debouncedValidate = useCallback(debounce(validateForm, 250), [
    validateForm
  ])
  useEffect(() => {
    debouncedValidate(values)
  }, [values.handle])

  let helperText: React.ReactNode = errors.handle

  {
    /* TODO: Finish this + other social linking: */
  }
  if (errors.handle === messages.twitterReservedError) {
    helperText = (
      <>
        {messages.twitterReservedError}
        <TwitterLogin
          onFailure={() => {}}
          onSuccess={() => {}}
          requestTokenUrl={`${audiusBackendInstance.identityServiceUrl}/twitter`}
          loginUrl={`${audiusBackendInstance.identityServiceUrl}/twitter/callback`}
          // @ts-expect-error
          className={styles.hideTwitterButton}
        >
          {messages.linkToClaim}
        </TwitterLogin>
      </>
    )
  }

  return (
    <HarmonyTextField
      name='handle'
      label={messages.handle}
      helperText={helperText}
      startAdornmentText='@'
      placeholder={messages.handle}
      transformValue={(value) => value.replace(/\s/g, '')}
    />
  )
}

export const PickHandlePage = () => {
  const formikRef = useRef<FormikProps<PickHandleValues>>(null)
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()
  const { value } = useSelector(getHandleField)

  const handleSubmit = useCallback(
    (values: PickHandleValues) => {
      const { handle } = values
      dispatch(setValueField('handle', handle))
      navigate(SIGN_UP_FINISH_PROFILE_PAGE)
    },
    [dispatch, navigate]
  )

  const initialValues = {
    handle: value || ''
  }

  return (
    <Formik
      innerRef={formikRef}
      initialValues={initialValues}
      validate={toFormikValidate(handleSchema)}
      onSubmit={handleSubmit}
      validateOnChange={false}
    >
      {({ isSubmitting, isValid }) => (
        <Form>
          <Box>
            <Flex gap='l' direction='column'>
              <Box>
                <Text size='s' variant='label' color='subdued'>
                  1 {messages.outOf} 2
                </Text>
              </Box>
              <Box>
                <Text
                  color='heading'
                  size='l'
                  strength='default'
                  variant='heading'
                >
                  {messages.pickYourHandle}
                </Text>
              </Box>
              <Box>
                <Text size='l' variant='body'>
                  {messages.handleDescription}
                </Text>
              </Box>
            </Flex>
            <Box mt='2xl'>
              <HandleField />
            </Box>
            <Button
              type='submit'
              disabled={!isValid || isSubmitting}
              isLoading={isSubmitting}
            >
              {messages.continue}
            </Button>
          </Box>
        </Form>
      )}
    </Formik>
  )
}
