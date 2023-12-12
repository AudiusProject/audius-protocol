import {
  Box,
  Flex,
  IconCloudUpload,
  IconComponent,
  IconHeadphones,
  IconMessage,
  Text
} from '@audius/harmony'
import { useMedia as useMediaQuery } from 'react-use'

const messages = {
  heading: 'Your Music, Your Way',
  unlimitedStreaming: 'Unlimited Streaming & Uploads',
  directMessages: 'Message & Connect With Fans',
  adFree: 'Ad-Free, Offline Listening'
}

type AudiusValueProps = { icon: IconComponent; text: string; dynamic?: boolean }

/**
 * Each individual audius value text + icon row
 */
const AudiusValue = (props: AudiusValueProps) => {
  const { icon: Icon, text } = props
  const isSmallDesktop = useMediaQuery('(min-width: 1363px)')

  return (
    <Flex alignItems='center' justifyContent='center' gap='m'>
      <Icon color='staticWhite' size={isSmallDesktop ? '2xl' : 'l'} />
      <Text
        variant={isSmallDesktop ? 'heading' : 'title'}
        size={isSmallDesktop ? 'xl' : 'l'}
        strength={isSmallDesktop ? 'default' : 'weak'}
        color='staticWhite'
        shadow='emphasis'
      >
        {text}
      </Text>
    </Flex>
  )
}

/**
 * Renders all the audius values
 */

type AudiusValuesProps = {
  className?: string
}

export const AudiusValues = (props: AudiusValuesProps) => {
  const isSmallDesktop = useMediaQuery('(min-width: 1363px)')

  return (
    <Flex
      direction='column'
      gap={isSmallDesktop ? 'xl' : 'l'}
      alignItems='center'
      p='xl'
      {...props}
    >
      {isSmallDesktop ? (
        <Box pb='l'>
          <Text
            variant='display'
            size='s'
            strength='strong'
            color='staticWhite'
            shadow='emphasis'
          >
            {messages.heading}
          </Text>
        </Box>
      ) : null}
      <AudiusValue icon={IconCloudUpload} text={messages.unlimitedStreaming} />
      <AudiusValue icon={IconMessage} text={messages.directMessages} />
      <AudiusValue icon={IconHeadphones} text={messages.adFree} />
    </Flex>
  )
}
