import { Flex, Text } from '@audius/harmony'

import LoadingSpinner from '../loading-spinner/LoadingSpinner'

const messages = {
  title: 'Transaction in Progress',
  subtitle: 'This may take a moment.'
}

type ModalLoadingProps = {
  title?: string
  subtitle?: string
  noText?: boolean
}

export const ModalLoading = ({
  title = messages.title,
  subtitle = messages.subtitle,
  noText = false
}: ModalLoadingProps) => {
  return (
    <Flex
      direction='column'
      justifyContent='center'
      alignItems='center'
      gap='l'
      p='xl'
      m='unit24'
    >
      <LoadingSpinner />
      <Flex direction='column' alignItems='center' gap='s'>
        {!noText ? (
          <Text variant='heading' size='l' color='default' textAlign='center'>
            {title}
          </Text>
        ) : (
          <></>
        )}
        {!noText ? (
          <Text
            variant='title'
            size='l'
            strength='weak'
            color='default'
            textAlign='center'
          >
            {subtitle}
          </Text>
        ) : (
          <></>
        )}
      </Flex>
    </Flex>
  )
}
