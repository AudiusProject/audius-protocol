import { Box, Flex, Text } from '@audius/harmony'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import styles from './SocialMediaLoading.module.css'

const messages = {
  hangTight: 'Hang tight!',
  connectingSocialMedia: 'We’re connecting your social account'
}

export const SocialMediaLoading = () => {
  return (
    <Flex
      direction='column'
      alignItems='center'
      h='100%'
      justifyContent='center'
      gap='2xl'
      css={{ textAlign: 'center', marginBottom: '20%' }}
    >
      <Text variant='heading' size='l' color='accent'>
        {messages.hangTight}
        <br />
        {messages.connectingSocialMedia}&hellip;
      </Text>
      <Box mb='2xl'>
        <LoadingSpinner className={styles.spinner} />
      </Box>
    </Flex>
  )
}
