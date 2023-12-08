import { passwordSchema } from '@audius/common'
import {
  Button,
  ButtonType,
  Flex,
  IconArrowRight,
  IconComponent,
  useTheme
} from '@audius/harmony'
import { Form, Formik } from 'formik'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
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
  const { color } = useTheme()

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
              iconRight={isLoading ? undefined : Icon}
              disabled={!isValid || isLoading}
              variant={ButtonType.PRIMARY}
            >
              <>
                {continueLabel}
                {isLoading ? (
                  <LoadingSpinner
                    css={{
                      height: 20,
                      width: 20,
                      '&& g path': { stroke: color.special.white }
                    }}
                  />
                ) : null}
              </>
            </Button>
          </Flex>
        </Flex>
      )}
    </Formik>
  )
}

export default EnterPassword
