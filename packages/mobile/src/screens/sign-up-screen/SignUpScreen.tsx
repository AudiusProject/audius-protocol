import { View } from 'react-native'

import { Link } from '@audius/harmony-native'
import { Text } from 'app/components/core'

import type { RootScreenParamList } from '../root-screen'

const messages = {
  header: 'Sign Up For Audius',
  signInDescription: 'Already have an account?',
  signIn: 'Sign In'
}

export const SignUpScreen = () => {
  return (
    <View>
      <Text role='heading'>{messages.header}</Text>
      <View>
        <Text>{messages.signInDescription}</Text>
        <Link<RootScreenParamList> to={{ screen: 'SignIn' }}>
          {messages.signIn}
        </Link>
      </View>
    </View>
  )
}
