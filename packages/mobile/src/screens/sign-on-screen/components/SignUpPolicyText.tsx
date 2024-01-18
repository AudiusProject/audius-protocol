import { signUpPolicyMessages as messages } from '@audius/common'
import {
  BASE_URL,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE
} from 'audius-client/src/utils/route'

import { Text, TextLink } from '@audius/harmony-native'

const termsOfUseLink = `${BASE_URL}${TERMS_OF_SERVICE}`
const privacyPolicyLink = `${BASE_URL}${PRIVACY_POLICY}`

export const SignUpAgreementText = () => {
  return (
    <Text color='default' size='s' strength='default' variant='body'>
      {messages.agreeTo}
      <TextLink variant='visible' size='s' url={termsOfUseLink}>
        {messages.termsOfService}
      </TextLink>
      {messages.and}
      <TextLink variant='visible' size='s' url={privacyPolicyLink}>
        {messages.privacyPolicy}
      </TextLink>
    </Text>
  )
}
