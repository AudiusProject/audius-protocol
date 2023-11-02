import React, { PropsWithChildren } from 'react'

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
      w={isDesktop ? 1280 : 480}
      h={864}
      borderRadius='l'
      shadow='far'
    >
      {children}
      {isDesktop ? <AudiusValues /> : null}
    </Flex>
  )
}

const AudiusValue = (props: { icon: IconComponent; text: string }) => {
  const { icon: Icon, text } = props
  return (
    <Flex
      className={styles.valueRow}
      direction='row'
      gap='l'
      alignItems='center'
    >
      <Icon className={styles.icon} />
      <Text variant='heading' size='xl'>
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
      h={864}
      direction='column'
      alignItems='center'
      justifyContent='center'
    >
      <Flex direction='column' gap='xl'>
        <Box pb='l'>
          <Text variant='display' size='s' strength='strong'>
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
