import { Platform } from 'react-native'

import {
  Flex,
  IconLogoLinkByStripe,
  spacing,
  Text
} from '@audius/harmony-native'

const messages = {
  poweredby: 'Powered by'
}

export const StripeSection = () => {
  const isIOS = Platform.OS === 'ios'
  return (
    <Flex
      row
      gap='s'
      justifyContent='center'
      alignItems='center'
      borderTop='default'
      borderBottom='default'
      backgroundColor='surface1'
    >
      {/* iOS hack due to label variant alignment bug */}
      <Flex mt={isIOS ? spacing.unit1 : undefined}>
        <Text variant='label' size='s' color='subdued'>
          {messages.poweredby}
        </Text>
      </Flex>
      <IconLogoLinkByStripe width={spacing.unit24} color='subdued' />
    </Flex>
  )
}
