import { signUpPolicyMessages } from '@audius/common/messages'
import { route } from '@audius/common/utils'

import { Text, TextLink } from '@audius/harmony-native'
import { env } from 'app/env'
const { PRIVACY_POLICY, TERMS_OF_SERVICE } = route

const termsOfUseLink = `${env.AUDIUS_URL}${TERMS_OF_SERVICE}`
const privacyPolicyLink = `${env.AUDIUS_URL}${PRIVACY_POLICY}`

export const SignUpAgreementText = () => {
  return (
    <Text color='default' size='s' strength='default' variant='body'>
      {signUpPolicyMessages.agreeTo}
      <TextLink variant='visible' size='s' url={termsOfUseLink}>
        {signUpPolicyMessages.termsOfService}
      </TextLink>
      {signUpPolicyMessages.and}
      <TextLink variant='visible' size='s' url={privacyPolicyLink}>
        {signUpPolicyMessages.privacyPolicy}
      </TextLink>
    </Text>
  )
}
