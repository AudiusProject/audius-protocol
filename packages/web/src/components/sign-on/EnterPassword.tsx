import { passwordSchema } from '@audius/common'
import { Button, Flex, IconArrowRight, IconComponent } from '@audius/harmony'
import { Form, Formik } from 'formik'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { EnterPasswordSection } from 'pages/sign-up-page/components/EnterPasswordSection'

const initialValues = {
  password: '',
  confirmPassword: ''
}

const passwordFormikSchma = toFormikValidationSchema(passwordSchema)

type EnterPasswordProps = {
  continueLabel: string
  continueIcon?: IconComponent
  onSubmit: (password: string) => void
  isLoading?: boolean
}

const EnterPassword = ({
  continueLabel,
  continueIcon,
  isLoading,
  onSubmit
}: EnterPasswordProps) => {
  const Icon = continueIcon ?? IconArrowRight

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={({ password }) => {
        onSubmit(password)
      }}
      validationSchema={passwordFormikSchma}
    >
      {({ isValid }) => (
        <Flex
          as={Form}
          direction='column'
          gap='xl'
          pb='m'
          ph='xl'
          h='100%'
          w='100%'
          justifyContent='space-between'
        >
          <EnterPasswordSection />
          <Flex justifyContent='center'>
            <Button
              name='continue'
              type='submit'
              iconRight={Icon}
              disabled={!isValid}
              variant='primary'
              isLoading={isLoading}
            >
              {continueLabel}
            </Button>
          </Flex>
        </Flex>
      )}
    </Formik>
  )
}

export default EnterPassword
