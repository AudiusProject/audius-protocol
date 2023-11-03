import { useCallback, useEffect, useState } from 'react'

import {
  Box,
  Button,
  ButtonType,
  Flex,
  IconArrowLeft,
  IconArrowRight,
  PasswordInput,
  Text
} from '@audius/harmony'
import { Form, Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'

import { setValueField } from 'common/store/pages/signon/actions'
import { getEmailField } from 'common/store/pages/signon/selectors'
import {
  CompletionChecklistItem,
  CompletionChecklistItemStatus
} from 'components/completion-checklist-item/CompletionChecklistItem'
import { ExternalLink } from 'components/link'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import {
  PRIVACY_POLICY,
  SIGN_UP_EMAIL_PAGE,
  SIGN_UP_HANDLE_PAGE,
  SIGN_UP_START_PAGE,
  TERMS_OF_SERVICE
} from 'utils/route'

import styles from '../styles/CreatePasswordPage.module.css'
import {
  PasswordRequirementKey,
  getLengthRequirementStatus,
  getMatchRequirementStatus,
  getNotCommonRequirementStatus,
  getNumberRequirementStatus,
  isRequirementsFulfilled
} from '../utils/passwordRequirementUtils'
import { PageWithAudiusValues } from 'pages/sign-on/components/desktop/PageWithAudiusValues'
import { LeftContentContainer } from 'pages/sign-on/components/desktop/LeftContentContainer'
import { IconButton } from '@audius/stems'

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
  privacyPolicy: 'Privacy Policy.',
  goBack: 'Go back'
}

const initialValues = {
  password: '',
  confirmPassword: ''
}

type CreatePasswordValues = {
  password: string
  confirmPassword: string
}

export const CreatePasswordPage = () => {
  const dispatch = useDispatch()
  const emailField = useSelector(getEmailField)
  const navigate = useNavigateToPage()

  useEffect(() => {
    if (!emailField?.value) {
      navigate(SIGN_UP_START_PAGE)
    }
  }, [emailField.value, navigate])

  const handleClickBackIcon = useCallback(() => {
    navigate(SIGN_UP_EMAIL_PAGE)
  }, [])

  const handleSubmit = useCallback(
    async ({ password, confirmPassword }: CreatePasswordValues) => {
      const fulfillsRequirements = await isRequirementsFulfilled({
        password,
        confirmPassword
      })
      if (fulfillsRequirements) {
        dispatch(setValueField('password', password))
        navigate(SIGN_UP_HANDLE_PAGE)
      }
    },
    [dispatch, navigate]
  )

  const [requirementsStatuses, setRequirementsStatuses] = useState<{
    [key in PasswordRequirementKey]: CompletionChecklistItemStatus
  }>({
    hasNumber: 'incomplete',
    minLength: 'incomplete',
    matches: 'incomplete',
    notCommon: 'incomplete'
  })
  const requirements: {
    status: CompletionChecklistItemStatus
    label: string
    key: PasswordRequirementKey
    path: keyof CreatePasswordValues
  }[] = [
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
  ]

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
    <Flex h='100%' alignItems='center' justifyContent='center'>
      <PageWithAudiusValues>
        <LeftContentContainer pv='2xl'>
          <Box>
            <IconButton
              onClick={handleClickBackIcon}
              aria-label={messages.goBack}
              icon={<IconArrowLeft />}
              className={styles.backIcon}
            />
            <Box mt='xl'>
              <Text
                color='heading'
                size='l'
                strength='default'
                variant='heading'
              >
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
                {emailField.value}
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
                  <Flex
                    direction='column'
                    justifyContent='space-between'
                    h='100%'
                  >
                    <Box>
                      <Flex
                        direction='column'
                        gap='l'
                        className={styles.inputsContainer}
                      >
                        <PasswordInput
                          name='password'
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
                        <PasswordInput
                          name='confirmPassword'
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
                          error={
                            touched.confirmPassword && hasConfirmPasswordError
                          }
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
                        <ExternalLink
                          variant='body'
                          color='accentPurple'
                          size='small'
                          to={TERMS_OF_SERVICE}
                        >
                          {messages.termsOfService}
                        </ExternalLink>
                        {messages.and}
                        <ExternalLink
                          to={PRIVACY_POLICY}
                          variant='body'
                          color='accentPurple'
                          size='small'
                        >
                          {messages.privacyPolicy}
                        </ExternalLink>
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
        </LeftContentContainer>
      </PageWithAudiusValues>
    </Flex>
  )
}
