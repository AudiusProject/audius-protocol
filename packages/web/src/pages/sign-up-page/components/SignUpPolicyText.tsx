import { signUpPolicyMessages } from '@audius/common/messages'
import { route } from '@audius/common/utils'
import { Text, TextLink } from '@audius/harmony'

const { PRIVACY_POLICY, TERMS_OF_SERVICE } = route

export const SignUpAgreementText = () => {
  return (
    <Text color='default' size='s' strength='default' variant='body'>
      {signUpPolicyMessages.agreeTo}
      <TextLink href={TERMS_OF_SERVICE} variant='visible' isExternal>
        {signUpPolicyMessages.termsOfService}
      </TextLink>
      {signUpPolicyMessages.and}
      <TextLink href={PRIVACY_POLICY} variant='visible' isExternal>
        {signUpPolicyMessages.privacyPolicy}
      </TextLink>
    </Text>
  )
}
