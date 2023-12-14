import { signUpPolicyMessages as messages } from '@audius/common'
import {
  BASE_URL,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE
} from 'audius-client/src/utils/route'
import { Linking } from 'react-native'

import { Text } from '@audius/harmony-native'

const termsOfUseLink = `${BASE_URL}${TERMS_OF_SERVICE}`
const privacyPolicyLink = `${BASE_URL}${PRIVACY_POLICY}`

const onTermsOfUsePress = () => {
  Linking.openURL(termsOfUseLink).catch((err) =>
    console.error('An error occurred trying to open terms of use', err)
  )
}

const onPrivacyPolicyPress = () => {
  Linking.openURL(privacyPolicyLink).catch((err) =>
    console.error('An error occurred trying to open privacy policy', err)
  )
}

export const SignUpAgreementText = () => {
  return (
    <Text color='default' size='s' strength='default' variant='body'>
      {messages.agreeTo}
      <Text color='accent' size='s' onPress={onTermsOfUsePress}>
        {messages.termsOfService}
      </Text>
      {messages.and}
      <Text color='accent' size='s' onPress={onPrivacyPolicyPress}>
        {messages.privacyPolicy}
      </Text>
    </Text>
  )
}
