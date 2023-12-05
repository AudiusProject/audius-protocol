import { Text, Link } from '@audius/harmony-native'

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
      {/* TODO: set up these links */}
      {/* <TextLink href={TERMS_OF_SERVICE} variant='visible' isExternal>
        {messages.termsOfService}
      </TextLink>
      {messages.and}
      <TextLink href={PRIVACY_POLICY} variant='visible' isExternal>
        {messages.privacyPolicy}
      </TextLink> */}
      <Link to={{ screen: '' }}>{messages.termsOfService}</Link>
      {messages.and}
      <Link to={{ screen: '' }}>{messages.privacyPolicy}</Link>
    </Text>
  )
}
