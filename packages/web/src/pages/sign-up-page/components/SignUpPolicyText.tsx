import { Text, TextLink } from '@audius/harmony'

import { PRIVACY_POLICY, TERMS_OF_SERVICE } from 'utils/route'

const messages = {
  agreeTo:
    "By clicking continue, you state you have read and agree to Audius' ",
  termsOfService: 'Terms of Service',
  and: ' and ',
  privacyPolicy: 'Privacy Policy.'
}

export const SignUpAgreementText = () => {
  return (
    <Text color='default' size='s' strength='default' variant='body'>
      {messages.agreeTo}
      <TextLink href={TERMS_OF_SERVICE} variant='visible' isExternal>
        {messages.termsOfService}
      </TextLink>
      {messages.and}
      <TextLink href={PRIVACY_POLICY} variant='visible' isExternal>
        {messages.privacyPolicy}
      </TextLink>
    </Text>
  )
}
