import { useCallback } from 'react'

import { Box, Button, Flex, Text } from '@audius/harmony'
import { Form, Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'

import { setValueField } from 'common/store/pages/signon/actions'
import { getHandleField } from 'common/store/pages/signon/selectors'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SIGN_UP_FINISH_PROFILE_PAGE } from 'utils/route'
import { z } from 'zod'
import { MAX_HANDLE_LENGTH } from '@audius/common'
import restrictedHandles from 'utils/restrictedHandles'

 const developerAppSchema = z.object({
  handle: z.string().max(MAX_HANDLE_LENGTH).regex( /^[a-zA-Z0-9_.]*$/, messages.).(restrictedHandles)
  name: z.string().max(DEVELOPER_APP_NAME_MAX_LENGTH),
  description: z.string().max(DEVELOPER_APP_DESCRIPTION_MAX_LENGTH).optional()
})

if (handle.length > MAX_HANDLE_LENGTH) {
  yield put(signOnActions.validateHandleFailed('tooLong'))
  if (onValidate) onValidate(true)
  return
} else if (!isHandleCharacterCompliant(handle)) {
  yield put(signOnActions.validateHandleFailed('characters'))
  if (onValidate) onValidate(true)
  return
} else if (isRestrictedHandle(handle)) {
  yield put(signOnActions.validateHandleFailed('inUse'))
  if (onValidate) onValidate(true)
  return

const FormSchema = z.object({
  email: z
    .string({ required_error: messages.invalidEmail })
    .regex(EMAIL_REGEX, { message: messages.invalidEmail })
})
const messages = {
  pickYourHandle: 'Pick Your Handle',
  outOf: 'of',
  handleDescription:
    'This is how others find and tag you. It is totally unique to you & cannot be changed later.',
  handle: 'Handle',
  continue: 'Continue'
}

const initialValues = {
  handle: ''
}

type PickHandleValues = {
  handle: string
}

export const PickHandlePage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()
  const { value, error, status } = useSelector(getHandleField)

  const handleSubmit = useCallback(
    (values: PickHandleValues) => {
      const { handle } = values
      dispatch(setValueField('handle', handle))
      navigate(SIGN_UP_FINISH_PROFILE_PAGE)
    },
    [dispatch, navigate]
  )

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
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
            <HarmonyTextField
              name='handle'
              label={messages.handle}
              startAdornmentText='@'
              placeholder={messages.handle}
              transformValue={(value) => value.replace(/\s/g, '')}
            />
          </Box>
          <Button type='submit'> {messages.continue} </Button>
        </Box>
      </Form>
    </Formik>
  )
}
