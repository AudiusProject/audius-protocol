import { PropsWithChildren } from 'react'

import {
  Box,
  Flex,
  IconCloudUpload,
  IconComponent,
  IconHeadphones,
  IconMessage,
  Text
} from '@audius/harmony'

import { useMedia } from 'hooks/useMedia'

import styles from './PageWithAudiusValues.module.css'

type PageWithAudiusValuesProps = PropsWithChildren<{}>

const messages = {
  heading: 'Your Music, Your Way',
  unlimitedStreaming: 'Unlimited Streaming & Uploads',
  directMessages: 'Message & Connect With Fans',
  adFree: 'Ad-Free, Offline Listening'
}

export const PageWithAudiusValues = (props: PageWithAudiusValuesProps) => {
  const { children } = props
  const { isDesktop } = useMedia()

  return (
    <Flex
      className={styles.root}
      direction='row'
      borderRadius='l'
      shadow='far'
      css={{ zIndex: 1, maxWidth: isDesktop ? 1280 : 480, maxHeight: 864 }}
    >
      {children}
      {isDesktop ? <AudiusValues /> : null}
    </Flex>
  )
}

const AudiusValue = (props: { icon: IconComponent; text: string }) => {
  const { icon: Icon, text } = props
  return (
    <Flex alignItems='center' justifyContent='center' gap='m'>
      <Icon color='staticWhite' size='2xl' />
      <Text
        variant='heading'
        size='xl'
        color='staticWhite'
        shadow='emphasis'
        css={{ textAlign: 'center' }}
      >
        {text}
      </Text>
    </Flex>
  )
}

const AudiusValues = () => {
  return (
    <Flex
      className={styles.valuesRoot}
      w={800}
      direction='column'
      alignItems='center'
      justifyContent='center'
    >
      <Flex direction='column' gap='xl'>
        <Box pb='l'>
          <Text
            variant='display'
            size='s'
            strength='strong'
            color='staticWhite'
            shadow='emphasis'
            css={{ textAlign: 'center' }}
          >
            {messages.heading}
          </Text>
        </Box>
        <AudiusValue
          icon={IconCloudUpload}
          text={messages.unlimitedStreaming}
        />
        <AudiusValue icon={IconMessage} text={messages.directMessages} />
        <AudiusValue icon={IconHeadphones} text={messages.adFree} />
      </Flex>
    </Flex>
  )
}
