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

import { useMedia } from 'hooks/useMedia'

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
  const { icon: Icon, text, dynamic } = props
  const { isDesktop } = useMedia()

  return (
    <Flex alignItems='center' justifyContent='center' gap='m'>
      <Icon color='staticWhite' size={isDesktop ? '2xl' : 'l'} />
      <Text
        variant={isDesktop ? 'heading' : 'title'}
        size={isDesktop ? 'xl' : 'l'}
        strength={isDesktop ? 'default' : 'weak'}
        color='staticWhite'
        shadow='emphasis'
        css={dynamic && { fontSize: '1.9vw' }}
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
  const { isDesktop } = useMedia()
  const tooSmall = useMediaQuery('(max-width: 1363px) and (min-width: 860px)')

  return (
    <Flex
      direction='column'
      gap={isDesktop ? 'xl' : 'l'}
      alignItems='center'
      p='xl'
      {...props}
    >
      {isDesktop ? (
        <Box pb='l'>
          <Text
            variant='display'
            size='s'
            strength='strong'
            color='staticWhite'
            shadow='emphasis'
            css={tooSmall && { fontSize: '2vw' }}
          >
            {messages.heading}
          </Text>
        </Box>
      ) : null}
      <AudiusValue
        icon={IconCloudUpload}
        text={messages.unlimitedStreaming}
        dynamic={tooSmall}
      />
      <AudiusValue
        icon={IconMessage}
        text={messages.directMessages}
        dynamic={tooSmall}
      />
      <AudiusValue
        icon={IconHeadphones}
        text={messages.adFree}
        dynamic={tooSmall}
      />
    </Flex>
  )
}
