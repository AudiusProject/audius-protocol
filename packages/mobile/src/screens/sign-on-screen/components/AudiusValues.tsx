import type { Icon } from '@audius/harmony-native'
import { Flex, Text } from '@audius/harmony-native'

import IconCloudUpload from './temp-harmony/iconCloudArrowUp.svg'
import IconHeadphones from './temp-harmony/iconHeadphones.svg'
import IconMessage from './temp-harmony/iconMessages.svg'

const messages = {
  heading: 'Your Music, Your Way',
  unlimitedStreaming: 'Unlimited Streaming & Uploads',
  directMessages: 'Message & Connect With Fans',
  adFree: 'Ad-Free, Offline Listening'
}

type AudiusValueProps = { icon: Icon; text: string }

/**
 * Each individual audius value text + icon row
 */
const AudiusValue = (props: AudiusValueProps) => {
  const { icon: Icon, text } = props
  return (
    <Flex alignItems='center' justifyContent='center' gap='m' direction='row'>
      <Icon color='staticWhite' size='l' />
      <Text variant='title' size='l' strength='weak' color='staticWhite'>
        {text}
      </Text>
    </Flex>
  )
}

/**
 * Renders all the audius values
 */
export const AudiusValues = () => {
  return (
    <Flex
      direction='column'
      gap='l'
      alignItems='center'
      justifyContent='center'
      style={{ flexGrow: 1 }}
    >
      <AudiusValue icon={IconCloudUpload} text={messages.unlimitedStreaming} />
      <AudiusValue icon={IconMessage} text={messages.directMessages} />
      <AudiusValue icon={IconHeadphones} text={messages.adFree} />
    </Flex>
  )
}
