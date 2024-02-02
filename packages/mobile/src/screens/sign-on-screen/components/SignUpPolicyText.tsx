import { signUpPolicyMessages } from '@audius/common/messages'
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
