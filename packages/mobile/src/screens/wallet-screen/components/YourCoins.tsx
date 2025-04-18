import { useCallback } from 'react'

import { useFormattedAudioBalance } from '@audius/common/hooks'
import { walletMessages } from '@audius/common/messages'
import { TouchableOpacity } from 'react-native'

import {
  Flex,
  IconCaretRight,
  IconLogoCircle,
  Paper,
  Text
} from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

const ICON_SIZE = 48

const useStyles = makeStyles(({ palette }) => ({
  container: {
    borderRadius: spacing(4)
  },
  iconWrapper: {
    width: ICON_SIZE,
    height: ICON_SIZE
  },
  tokenRow: {
    borderRadius: spacing(4)
  }
}))

export const YourCoins = () => {
  const navigation = useNavigation()
  const styles = useStyles()

  const {
    audioBalanceFormatted,
    audioDollarValue,
    isAudioBalanceLoading,
    isAudioPriceLoading
  } = useFormattedAudioBalance()

  const handleTokenClick = useCallback(() => {
    navigation.navigate('AudioScreen')
  }, [navigation])

  const displayAmount = isAudioBalanceLoading
    ? walletMessages.loading
    : audioBalanceFormatted

  return (
    <Paper style={styles.container}>
      <TouchableOpacity onPress={handleTokenClick}>
        <Flex
          p='l'
          direction='row'
          justifyContent='space-between'
          alignItems='center'
          style={styles.tokenRow}
        >
          <Flex direction='row' alignItems='center' gap='m'>
            <IconLogoCircle width={ICON_SIZE} height={ICON_SIZE} />
            <Flex direction='column' gap='xs'>
              <Flex direction='row' alignItems='center' gap='xs'>
                <Text variant='heading' size='l' color='default'>
                  {displayAmount}
                </Text>
                <Text variant='heading' size='l' color='subdued'>
                  $AUDIO
                </Text>
              </Flex>
              <Text variant='heading' size='s' color='subdued'>
                {isAudioPriceLoading
                  ? walletMessages.loadingPrice
                  : audioDollarValue}
              </Text>
            </Flex>
          </Flex>
          <IconCaretRight size='s' color='subdued' />
        </Flex>
      </TouchableOpacity>
    </Paper>
  )
}
