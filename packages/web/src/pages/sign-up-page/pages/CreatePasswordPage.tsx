import { useCallback, useState } from 'react'

import {
  Box,
  Button,
  ButtonType,
  Flex,
  Text,
  TextInput,
  IconArrowRight
} from '@audius/harmony'
import { Form, Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'

import { setValueField } from 'common/store/pages/signon/actions'
import { getEmailField } from 'common/store/pages/signon/selectors'
import {
  CompletionChecklistItem,
  CompletionChecklistItemStatus
} from 'components/completion-checklist-item/CompletionChecklistItem'
import { Link } from 'components/link'
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from 'utils/route'

import styles from '../styles/CreatePasswordPage.module.css'
import {
  PasswordRequirementKey,
  getLengthRequirementStatus,
  getMatchRequirementStatus,
  getNotCommonRequirementStatus,
  getNumberRequirementStatus,
  isRequirementsFulfilled
} from '../utils/passwordRequirementUtils'

import { PickHandleState } from './PickHandlePage'
import { SignUpState } from './SignUpPage'

const messages = {
  createYourPassword: 'Create Your Password',
  createLoginDetails: 'Create Login Details',
  description:
    'Create a password that’s secure and easy to remember! We can’t reset your password, so write it down or use a password manager.',
  yourEmail: 'Your Email',
  passwordLabel: 'Password',
  confirmPasswordLabel: 'Confirm Password',
  requirements: {
    hasNumber: 'Must contain numbers',
    minLength: 'At least 8 characters',
    matches: 'Passwords match',
    notCommon: 'Hard to guess'
  },
  commonPassword: 'Please choose a less common password',
  continue: 'Continue',
  agreeTo:
    "By clicking continue, you state you have read and agree to Audius' ",
  termsOfService: 'Terms of Service',
  and: ' and ',
  privacyPolicy: 'Privacy Policy.'
}

export type CreatePasswordState = {
  stage: 'create-password'
}

const initialValues = {
  password: '',
  confirmPassword: ''
}

type CreatePasswordValues = {
  password: string
  confirmPassword: string
}

type CreatePasswordPageProps = {
  onPrevious: (state: SignUpState) => void
  onNext: (state: PickHandleState) => void
}

export const CreatePasswordPage = (props: CreatePasswordPageProps) => {
  const { onNext } = props
  const dispatch = useDispatch()
  const emailField = useSelector(getEmailField)

  const handleSubmit = useCallback(
    async ({ password, confirmPassword }: CreatePasswordValues) => {
      const fulfillsRequirements = await isRequirementsFulfilled({
        password,
        confirmPassword
      })
      if (fulfillsRequirements) {
        dispatch(setValueField('password', password))
        onNext({ stage: 'pick-handle' })
      }
    },
    [dispatch, onNext]
  )

  const [requirementsStatuses, setRequirementsStatuses] = useState({
    hasNumber: 'incomplete',
    minLength: 'incomplete',
    matches: 'incomplete',
    notCommon: 'incomplete'
  } as { [key in PasswordRequirementKey]: CompletionChecklistItemStatus })

  const requirements = [
    {
      status: requirementsStatuses.hasNumber,
      label: messages.requirements.hasNumber,
      key: 'hasNumber',
      path: 'password'
    },
    {
      status: requirementsStatuses.minLength,
      label: messages.requirements.minLength,
      key: 'minLength',
      path: 'password'
    },
    {
      status: requirementsStatuses.matches,
      label: messages.requirements.matches,
      key: 'matches',
      path: 'confirmPassword'
    },
    {
      status: requirementsStatuses.notCommon,
      label: messages.requirements.notCommon,
      key: 'notCommon',
      path: 'password'
    }
  ] as {
    status: CompletionChecklistItemStatus
    label: string
    key: PasswordRequirementKey
    path: keyof CreatePasswordValues
  }[]

  const handlePasswordChange = useCallback(
    async ({ password, confirmPassword }: CreatePasswordValues) => {
      const hasNumber = getNumberRequirementStatus({
        password,
        ignoreError: requirementsStatuses.hasNumber === 'incomplete'
      })
      const minLength = getLengthRequirementStatus({
        password,
        ignoreError: requirementsStatuses.minLength === 'incomplete'
      })
      const matches = getMatchRequirementStatus({ password, confirmPassword })
      const notCommon = await getNotCommonRequirementStatus({
        password,
        ignoreError: requirementsStatuses.notCommon === 'incomplete'
      })
      setRequirementsStatuses((requirements) => ({
        ...requirements,
        hasNumber,
        minLength,
        matches,
        notCommon
      }))
    },
    [
      requirementsStatuses.hasNumber,
      requirementsStatuses.minLength,
      requirementsStatuses.notCommon
    ]
  )

  const handlePasswordBlur = useCallback(
    async ({ password, confirmPassword }: CreatePasswordValues) => {
      if (password) {
        const notCommon = await getNotCommonRequirementStatus({ password })
        setRequirementsStatuses((statuses) => ({
          ...statuses,
          hasNumber: getNumberRequirementStatus({ password }),
          minLength: getLengthRequirementStatus({ password }),
          notCommon,
          matches: getMatchRequirementStatus({ password, confirmPassword })
        }))
      }
    },
    []
  )

  const handleConfirmPasswordChange = useCallback(
    ({ password, confirmPassword }: CreatePasswordValues) => {
      if (
        requirementsStatuses.matches !== 'incomplete' ||
        password.length <= confirmPassword.length
      ) {
        setRequirementsStatuses((statuses) => ({
          ...statuses,
          matches: getMatchRequirementStatus({ password, confirmPassword })
        }))
      }
    },
    [requirementsStatuses.matches]
  )

  const handleConfirmPasswordBlur = useCallback(
    (values: CreatePasswordValues) => {
      if (values.password && values.confirmPassword) {
        setRequirementsStatuses((statuses) => ({
          ...statuses,
          matches: getMatchRequirementStatus({
            password: values.password,
            confirmPassword: values.confirmPassword,
            enforceConfirmPasswordNotEmpty: true
          })
        }))
      }
    },
    []
  )

  const hasPasswordError = requirements.some(
    (r) => r.status === 'error' && r.path === 'password'
  )

  const hasConfirmPasswordError = requirements.some(
    (r) => r.status === 'error' && r.path === 'confirmPassword'
  )

  const isValid = !hasPasswordError && !hasConfirmPasswordError

  return (
    // TODO: Remove all props and styles expect `direction='column'` when this page is plugged into sign up modal.
    <Flex
      w={480}
      h={'calc(100vh - 88px)'}
      p={'3xl'}
      className={styles.contentContainer}
      direction='column'
    >
      <Box>
        <Box mt='xl'>
          <Text color='heading' size='l' strength='default' variant='heading'>
            {messages.createYourPassword}
          </Text>
        </Box>
        <Box mt='l'>
          <Text color='default' size='l' variant='body'>
            {messages.description}
          </Text>
        </Box>
        <Box mt='2xl'>
          <Text variant='label' size='xs'>
            {messages.yourEmail}
          </Text>
          <Text variant='body' size='m'>
            {/* TODO(nkang): Remove `||` once email page completed */}
            {emailField?.value || 'email@email.com'}
          </Text>
        </Box>
      </Box>
      <Box mt='l' className={styles.formOuterContainer}>
        <Formik initialValues={initialValues} onSubmit={handleSubmit}>
          {({
            values,
            setFieldValue,
            isSubmitting,
            handleBlur: formikHandleBlur,
            touched
          }) => (
            <Form style={{ height: '100%' }}>
              <Flex direction='column' justifyContent='space-between' h='100%'>
                <Box>
                  <Flex
                    direction='column'
                    gap='l'
                    className={styles.inputsContainer}
                  >
                    <TextInput
                      name='password'
                      type='password'
                      autoFocus
                      autoComplete='new-password'
                      onChange={(e) => {
                        setFieldValue('password', e.target.value)
                        handlePasswordChange({
                          password: e.target.value,
                          confirmPassword: values.confirmPassword
                        })
                      }}
                      onBlur={(e) => {
                        formikHandleBlur(e)
                        handlePasswordBlur(values)
                      }}
                      label={messages.passwordLabel}
                      value={values.password}
                      error={touched.password && hasPasswordError}
                    />
                    <TextInput
                      name='confirmPassword'
                      type='password'
                      autoComplete='new-password'
                      onChange={(e) => {
                        setFieldValue('confirmPassword', e.target.value)
                        handleConfirmPasswordChange({
                          password: values.password,
                          confirmPassword: e.target.value
                        })
                      }}
                      onBlur={(e) => {
                        formikHandleBlur(e)
                        handleConfirmPasswordBlur(values)
                      }}
                      label={messages.confirmPasswordLabel}
                      value={values.confirmPassword}
                      error={touched.confirmPassword && hasConfirmPasswordError}
                    />
                  </Flex>
                  <Flex mt='l' gap='l' direction='column'>
                    {requirements.map((req) => (
                      <CompletionChecklistItem
                        key={req.key}
                        status={req.status}
                        label={req.label}
                      />
                    ))}
                  </Flex>
                </Box>

                <Flex direction='column' gap='l'>
                  <Text
                    color='default'
                    size='s'
                    strength='default'
                    variant='body'
                  >
                    {messages.agreeTo}
                    <Link
                      variant='body'
                      color='accentPurple'
                      size='small'
                      to={TERMS_OF_SERVICE}
                      target='_blank'
                      rel='noreferrer'
                    >
                      {messages.termsOfService}
                    </Link>
                    {messages.and}
                    <Link
                      to={PRIVACY_POLICY}
                      variant='body'
                      color='accentPurple'
                      size='small'
                      target='_blank'
                      rel='noreferrer'
                    >
                      {messages.privacyPolicy}
                    </Link>
                  </Text>
                  <Button
                    variant={ButtonType.PRIMARY}
                    disabled={isSubmitting || !isValid}
                    type='submit'
                    iconRight={IconArrowRight}
                  >
                    {messages.continue}
                  </Button>
                </Flex>
              </Flex>
            </Form>
          )}
        </Formik>
      </Box>
    </Flex>
  )
}
