import { useCallback, useContext, useEffect, useMemo, useRef } from 'react'

import { AudiusQueryContext, useDebouncedCallback } from '@audius/common'
import { Box, Button, Flex, Text } from '@audius/harmony'
import { Form, Formik, FormikProps, useFormikContext } from 'formik'
import { isEmpty } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import TwitterLogin from 'react-twitter-auth'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { setValueField } from 'common/store/pages/signon/actions'
import { getHandleField } from 'common/store/pages/signon/selectors'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { SIGN_UP_FINISH_PROFILE_PAGE } from 'utils/route'

import {
  generateHandleSchema,
  errorMessages as handleErrorMessages
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
  const {
    values,
    validateForm,
    errors: { handle: error }
  } = useFormikContext<PickHandleValues>()
  const debouncedValidate = useDebouncedCallback(
    validateForm,
    [validateForm],
    1000
  )
  useEffect(() => {
    debouncedValidate(values)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValidate, values.handle])

  let helperText: React.ReactNode = error

  // TODO: Finish this + other social linking:
  if (error === messages.twitterReservedError) {
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
      error={!!error && !isEmpty(values.handle)}
      helperText={!!error && !isEmpty(values.handle) ? helperText : undefined}
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
  const queryContext = useContext(AudiusQueryContext)
  const validationSchema = useMemo(() => {
    if (queryContext != null) {
      return toFormikValidationSchema(generateHandleSchema(queryContext))
    }
    return undefined
  }, [queryContext])

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
    <Box pv='3xl' className={styles.container}>
      <Formik
        innerRef={formikRef}
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        validateOnChange={false}
      >
        {({ isSubmitting, isValid, isValidating }) => (
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
                isLoading={isSubmitting || isValidating}
              >
                {messages.continue}
              </Button>
            </Box>
          </Form>
        )}
      </Formik>
    </Box>
  )
}
