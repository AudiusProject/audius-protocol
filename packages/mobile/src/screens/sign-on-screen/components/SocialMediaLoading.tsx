import { css } from '@emotion/native'

import {
  Box,
  Flex,
  IconButton,
  IconClose,
  Text,
  useTheme
} from '@audius/harmony-native'
import { LoadingMoreSpinner } from 'app/screens/library-screen/LoadingMoreSpinner'

const messages = {
  hangTight: 'Hang tight!',
  connectingSocialMedia: 'We’re connecting your social account'
}

export const SocialMediaLoading = ({
  onClose,
  hideIcon
}: {
  onClose: () => void
  hideIcon?: boolean
}) => {
  const { color, spacing } = useTheme()
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
        zIndex: 100,
        borderRadius: 0,
        background: color.background.white,
        backgroundColor: color.background.white
      })}
    >
      {hideIcon ? undefined : (
        <IconButton
          color='subdued'
          icon={IconClose}
          aria-label='Return to email screen'
          style={css({
            position: 'absolute',
            top: spacing.l,
            left: spacing.xl
          })}
          onPress={() => onClose()}
        />
      )}
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
