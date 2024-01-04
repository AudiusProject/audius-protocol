import { css } from '@emotion/native'

import { Box, Flex, Text, useTheme } from '@audius/harmony-native'
import { LoadingMoreSpinner } from 'app/screens/favorites-screen/LoadingMoreSpinner'

const messages = {
  hangTight: 'Hang tight!',
  connectingSocialMedia: 'We’re connecting your social account'
}

export const SocialMediaLoading = () => {
  const { color } = useTheme()
  return (
    <Flex
      direction='column'
      alignItems='center'
      justifyContent='center'
      gap='2xl'
      p='l'
      style={css({
        textAlign: 'center',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 6,
        borderRadius: 0,
        backgroundColor: color.background.white
      })}
    >
      <Text variant='heading' size='m' color='accent' textAlign='center'>
        {messages.hangTight}
        {'\n'}
        {messages.connectingSocialMedia}&hellip;
      </Text>
      <Box mb='2xl'>
        <LoadingMoreSpinner />
      </Box>
    </Flex>
  )
}
