import { useCallback, useContext, useState } from 'react'

import { AudiusQueryContext, signUpFetch } from '@audius/common'
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
import { IconButton } from '@audius/stems'
import { Field, Form, Formik, FormikHelpers, useFormikContext } from 'formik'
import { useDispatch, useSelector } from 'react-redux'

import { setValueField } from 'common/store/pages/signon/actions'
import {
  getEmailField,
  getLinkedSocialOnFirstPage
} from 'common/store/pages/signon/selectors'
import {
  CompletionChecklistItem,
  CompletionChecklistItemStatus
} from 'components/completion-checklist-item/CompletionChecklistItem'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { ExternalLink } from 'components/link'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import {
  ArtworkContainer,
  AudiusValues
} from 'pages/sign-on/components/AudiusValues'
import { LeftContentContainer } from 'pages/sign-on/components/desktop/LeftContentContainer'
import { SignOnContainerDesktop } from 'pages/sign-on/components/desktop/SignOnContainerDesktop'
import { AppState } from 'store/types'
import {
  PRIVACY_POLICY,
  SIGN_UP_EMAIL_PAGE,
  SIGN_UP_HANDLE_PAGE,
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

import { emailSchema } from './CreateEmailPage/CreateEmailPage'
import { messages as emailMessages } from './CreateEmailPage/messages'

const messages = {
  createYourPassword: 'Create Your Password',
  createLoginDetails: 'Create Login Details',
  passwordDescription:
    'Create a password that’s secure and easy to remember! We can’t reset your password, so write it down or use a password manager.',
  passwordAndEmailDescription: `Enter your email and create a password. Keep in mind that we can't reset your password.`,
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
  goBack: 'Go back',
  emailInUse: 'That email is already used by another Audius account.',
  ...emailMessages
}

const baseInitialValues = {
  password: '',
  confirmPassword: '',
  email: ''
}

type CreatePasswordValues = {
  password: string
  confirmPassword: string
  email: string
}

type PasswordFieldsProps = {
  onStatusChange: (
    setter: (currentStatus: {
      [key in PasswordRequirementKey]: CompletionChecklistItemStatus
    }) => {
      [key in PasswordRequirementKey]: CompletionChecklistItemStatus
    }
  ) => void
  autofocus: boolean
  requirementsStatuses: {
    [key in PasswordRequirementKey]: CompletionChecklistItemStatus
  }
}

const PasswordFields = ({
  requirementsStatuses,
  onStatusChange,
  autofocus
}: PasswordFieldsProps) => {
  const {
    values,
    handleBlur: formikHandleBlur,
    touched,
    setFieldValue
  } = useFormikContext<CreatePasswordValues>()

  const hasPasswordError =
    requirementsStatuses.hasNumber === 'error' ||
    requirementsStatuses.minLength === 'error' ||
    requirementsStatuses.notCommon === 'error'
  const hasConfirmPasswordError = requirementsStatuses.matches === 'error'

  const handlePasswordChange = useCallback(
    async ({
      password,
      confirmPassword
    }: Omit<CreatePasswordValues, 'email'>) => {
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
      onStatusChange((requirements) => ({
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
      requirementsStatuses.notCommon,
      onStatusChange
    ]
  )

  const handlePasswordBlur = useCallback(
    async ({
      password,
      confirmPassword
    }: Omit<CreatePasswordValues, 'email'>) => {
      if (password) {
        const notCommon = await getNotCommonRequirementStatus({ password })
        onStatusChange((statuses) => ({
          ...statuses,
          hasNumber: getNumberRequirementStatus({ password }),
          minLength: getLengthRequirementStatus({ password }),
          notCommon,
          matches: getMatchRequirementStatus({ password, confirmPassword })
        }))
      }
    },
    [onStatusChange]
  )

  const handleConfirmPasswordChange = useCallback(
    ({ password, confirmPassword }: Omit<CreatePasswordValues, 'email'>) => {
      if (
        requirementsStatuses.matches !== 'incomplete' ||
        password.length <= confirmPassword.length
      ) {
        onStatusChange((statuses) => ({
          ...statuses,
          matches: getMatchRequirementStatus({ password, confirmPassword })
        }))
      }
    },
    [requirementsStatuses.matches, onStatusChange]
  )

  const handleConfirmPasswordBlur = useCallback(
    (values: CreatePasswordValues) => {
      if (values.password && values.confirmPassword) {
        onStatusChange((statuses) => ({
          ...statuses,
          matches: getMatchRequirementStatus({
            password: values.password,
            confirmPassword: values.confirmPassword,
            enforceConfirmPasswordNotEmpty: true
          })
        }))
      }
    },
    [onStatusChange]
  )

  return (
    <>
      <PasswordInput
        name='password'
        autoFocus={autofocus}
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
        error={touched.confirmPassword && hasConfirmPasswordError}
      />
    </>
  )
}

export const CreatePasswordPage = () => {
  const queryContext = useContext(AudiusQueryContext)
  const dispatch = useDispatch()
  const emailField = useSelector(getEmailField)
  // If user "signed up with social" on the email page, they need to fill out their email on this page.
  const showEmailField = useSelector((state: AppState) =>
    getLinkedSocialOnFirstPage(state)
  )
  const navigate = useNavigateToPage()

  const initialValues = {
    ...baseInitialValues,
    email: emailField.value || ''
  }

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

  const handleClickBackIcon = useCallback(() => {
    navigate(SIGN_UP_EMAIL_PAGE)
  }, [navigate])

  const handleSubmit = useCallback(
    async (
      { password, confirmPassword, email }: CreatePasswordValues,
      { setErrors }: FormikHelpers<CreatePasswordValues>
    ) => {
      const [fulfillsPasswordRequirements, isEmailInUse] = await Promise.all([
        isRequirementsFulfilled({
          password,
          confirmPassword
        }),
        showEmailField
          ? signUpFetch.isEmailInUse({ email }, queryContext!)
          : Promise.resolve(false)
      ])
      if (fulfillsPasswordRequirements && !isEmailInUse) {
        if (showEmailField) {
          dispatch(setValueField('email', email))
        }
        dispatch(setValueField('password', password))
        navigate(SIGN_UP_HANDLE_PAGE)
      } else if (isEmailInUse) {
        setErrors({ email: messages.emailInUse })
      }
    },
    [showEmailField, dispatch, navigate, queryContext]
  )

  const [emailIsValid, setEmailIsValid] = useState(showEmailField === false)

  const validateEmail = useCallback((value: string) => {
    const result = emailSchema.safeParse(value)
    if (!result.success) {
      setEmailIsValid(false)
      return result.error.format()._errors?.[0]
    }
    setEmailIsValid(true)
  }, [])

  const hasPasswordError = requirements.some(
    (r) => r.status === 'error' && r.path === 'password'
  )

  const hasConfirmPasswordError = requirements.some(
    (r) => r.status === 'error' && r.path === 'confirmPassword'
  )

  const isValid = !hasPasswordError && !hasConfirmPasswordError && emailIsValid

  return (
    <Flex h='100%' alignItems='center' justifyContent='center'>
      <SignOnContainerDesktop>
        <LeftContentContainer pv='2xl'>
          <Box>
            <IconButton
              onClick={handleClickBackIcon}
              aria-label={messages.goBack}
              icon={
                <IconArrowLeft
                  css={{
                    '& path': {
                      fill: 'currentColor'
                    }
                  }}
                />
              }
              className={styles.backIcon}
            />
            <Box mt='xl'>
              <Text
                color='heading'
                size='l'
                strength='default'
                variant='heading'
              >
                {showEmailField
                  ? messages.createLoginDetails
                  : messages.createYourPassword}
              </Text>
            </Box>
            <Box mt='l'>
              <Text color='default' size='l' variant='body'>
                {showEmailField
                  ? messages.passwordAndEmailDescription
                  : messages.passwordDescription}
              </Text>
            </Box>
            {showEmailField ? null : (
              <Box mt='2xl'>
                <Text variant='label' size='xs'>
                  {messages.yourEmail}
                </Text>
                <Text variant='body' size='m'>
                  {emailField.value}
                </Text>
              </Box>
            )}
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
                        {showEmailField ? (
                          <Field
                            as={HarmonyTextField}
                            validate={validateEmail}
                            name='email'
                            autoFocus={showEmailField}
                            autoComplete='email'
                            label={messages.emailLabel}
                          />
                        ) : null}
                        <PasswordFields
                          requirementsStatuses={requirementsStatuses}
                          onStatusChange={setRequirementsStatuses}
                          autofocus={!showEmailField}
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
        <ArtworkContainer>
          <AudiusValues />
        </ArtworkContainer>
      </SignOnContainerDesktop>
    </Flex>
  )
}
